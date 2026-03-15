import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);

  getAgentId(): string {
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    if (!agentId) {
      throw new Error('ELEVENLABS_AGENT_ID not configured');
    }
    return agentId;
  }

  /**
   * Get a WebRTC token to start a conversation with the ElevenLabs agent.
   * The token is used by the client to establish a WebRTC connection.
   *
   * API: GET /v1/convai/conversation/token?agent_id={agent_id}
   * Docs: https://elevenlabs.io/docs/api-reference/conversations/get-webrtc-token
   */
  async getConversationToken(): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const agentId = this.getAgentId();

    const response = await fetch(
      `${ELEVENLABS_API_URL}/convai/conversation/token?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `ElevenLabs API error: ${response.status} ${errorBody}`,
      );
      throw new Error(`ELEVENLABS_ERROR: ${response.status} - ${errorBody}`);
    }

    const data = (await response.json()) as { token: string };
    return data.token;
  }

  /**
   * Verify webhook signature from ElevenLabs.
   *
   * ElevenLabs signature format: t=timestamp,v0=hash
   * The hash is HMAC-SHA256 of "timestamp.request_body"
   *
   * Docs: https://elevenlabs.io/docs/product-guides/administration/webhooks
   */
  verifyWebhookSignature(payload: string, signatureHeader: string): boolean {
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.warn(
        'ELEVENLABS_WEBHOOK_SECRET not configured, skipping signature verification',
      );
      return true;
    }

    if (!signatureHeader) {
      this.logger.warn(
        'No signature header present in webhook request, skipping verification',
      );
      return true;
    }

    try {
      // Parse signature header: t=timestamp,v0=hash
      const parts = signatureHeader.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signaturePart = parts.find((p) => p.startsWith('v0='));

      if (!timestampPart || !signaturePart) {
        this.logger.error('Invalid signature format');
        return false;
      }

      const timestamp = timestampPart.substring(2);

      // Reject requests older than 30 minutes
      const reqTimestamp = parseInt(timestamp) * 1000;
      const tolerance = Date.now() - 30 * 60 * 1000;
      if (reqTimestamp < tolerance) {
        this.logger.error('Webhook request expired');
        return false;
      }

      // Compute expected signature: HMAC-SHA256 of "timestamp.payload"
      const message = `${timestamp}.${payload}`;
      const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');
      const expectedSignature = `v0=${expectedHash}`;

      if (signaturePart !== expectedSignature) {
        this.logger.error('Signature mismatch');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return false;
    }
  }
}
