import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Headers,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { VoiceService } from './voice.service';
import { ElevenLabsService } from './elevenlabs.service';
import { ElevenLabsPostCallPayload } from './voice.types';

@Controller('api/voice')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);

  constructor(
    private readonly voiceService: VoiceService,
    private readonly elevenlabs: ElevenLabsService,
  ) {}

  /**
   * Start a voice session — returns a WebRTC conversation token.
   * Called by the frontend before connecting to ElevenLabs.
   *
   * Matches iterate project: start-session endpoint
   */
  @Post('start-session')
  async startSession(
    @Body() body: { session_type?: string; user_id?: string },
  ) {
    const sessionType = body.session_type || 'onboarding';
    const sessionId = crypto.randomUUID();

    const conversationToken = await this.elevenlabs.getConversationToken();

    this.voiceService.createSession({
      id: sessionId,
      userId: body.user_id,
      sessionType,
    });

    return {
      session_id: sessionId,
      conversation_token: conversationToken,
      agent_id: this.elevenlabs.getAgentId(),
    };
  }

  /**
   * ElevenLabs post-call webhook.
   * Receives post_call_transcription events after a conversation ends.
   *
   * MUST return HTTP 200 quickly to avoid being auto-disabled by ElevenLabs.
   * Matches iterate project: elevenlabs-webhook endpoint
   *
   * Docs: https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks
   */
  @Post('elevenlabs-webhook')
  @HttpCode(200)
  async elevenlabsWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('elevenlabs-signature') signatureLower: string,
    @Headers('ElevenLabs-Signature') signatureUpper: string,
  ) {
    try {
      // Get raw body for signature verification.
      // NestJS rawBody option stores the original buffer on the request.
      const rawBody = (req as any).rawBody
        ? (req as any).rawBody.toString('utf-8')
        : JSON.stringify(req.body);

      // Verify webhook signature (header is case-insensitive in HTTP)
      const signature = signatureUpper || signatureLower || '';
      const isValid = this.elevenlabs.verifyWebhookSignature(
        rawBody,
        signature,
      );

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        // Return 200 even on invalid signature to prevent webhook disable
        return res.status(200).json({ received: true, error: 'Invalid signature' });
      }

      const payload: ElevenLabsPostCallPayload = req.body;

      const { type, data } = payload;
      const conversationId = data?.conversation_id;

      this.logger.log(
        `Received ElevenLabs webhook: ${type} for conversation ${conversationId}`,
      );

      // Only handle post_call_transcription events
      if (type !== 'post_call_transcription') {
        this.logger.log(`Ignoring event type: ${type}`);
        return res.status(200).json({ received: true, ignored: true });
      }

      // Convert transcript array to string
      const transcriptText = data.transcript
        .map(
          (t) =>
            `${t.role === 'agent' ? 'Agent' : 'User'}: ${t.message}`,
        )
        .join('\n');

      // Find session by conversation_id or dynamic_variables
      const sessionId =
        data.conversation_initiation_client_data?.dynamic_variables
          ?.session_id;
      const userId =
        data.conversation_initiation_client_data?.dynamic_variables?.user_id;

      // Update session with transcript
      this.voiceService.completeSession({
        sessionId,
        conversationId,
        userId,
        transcript: transcriptText,
        messages: data.transcript.map((t) => ({
          role: t.role === 'agent' ? 'assistant' : 'user',
          content: t.message,
          time_in_call_secs: t.time_in_call_secs,
        })),
      });

      // Process session async — don't block the 200 response
      this.voiceService
        .processPostCallAsync(sessionId, userId, transcriptText)
        .catch((err) => {
          this.logger.error('Error processing post-call async:', err);
        });

      // Return 200 immediately as required by ElevenLabs
      return res.status(200).json({ received: true, processed: true });
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error in elevenlabs-webhook:', err);

      // Return 200 even on error to prevent webhook from being disabled
      return res.status(200).json({ received: true, error: err.message });
    }
  }

  // ─── Voice Tool Endpoints (called by ElevenLabs during live conversation) ───

  @Post('tools/write-user-profile')
  async writeUserProfile(
    @Body()
    body: {
      name: string;
      skills: string[];
      location_area: string;
      lat: number;
      lng: number;
      previous_role?: string;
      status?: string;
    },
  ) {
    return this.voiceService.writeUserProfile(body);
  }

  @Post('tools/get-opportunities')
  async getOpportunities(@Body() body: { user_id: string }) {
    return this.voiceService.getOpportunities(body);
  }

  @Post('tools/get-draft-listing')
  async getDraftListing(
    @Body() body: { user_id: string; opportunity_index?: number },
  ) {
    return this.voiceService.getDraftListing(body);
  }

  @Post('tools/publish-listing')
  async publishListing(
    @Body()
    body: {
      user_id: string;
      title: string;
      description: string;
      price_pence: number;
      capacity: number;
      category: string;
      lat: number;
      lng: number;
      tags?: string[];
      included?: string[];
    },
  ) {
    return this.voiceService.publishListing(body);
  }

  @Post('tools/get-matches')
  async getMatches(@Body() body: { user_id: string }) {
    return this.voiceService.getMatches(body);
  }

  @Post('tools/approve-deal')
  async approveDeal(
    @Body()
    body: {
      negotiation_id: string;
      user_id: string;
      approved: boolean;
    },
  ) {
    return this.voiceService.approveDeal(body);
  }

  @Post('tools/get-local-context')
  async getLocalContext(@Body() body: { lat: number; lng: number }) {
    return this.voiceService.getLocalContext(body);
  }
}
