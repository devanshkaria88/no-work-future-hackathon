import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeService {
  private readonly client: Anthropic;
  private readonly logger = new Logger(ClaudeService.name);

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(params: {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature ?? 0.7,
        system: params.system,
        messages: params.messages,
      });
      const block = response.content[0];
      if (block.type === 'text') {
        return block.text;
      }
      throw new Error(`Unexpected content block type: ${block.type}`);
    } catch (error) {
      this.logger.error('Claude API call failed', error);
      throw error;
    }
  }

  async chatJSON<T>(params: {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    maxTokens?: number;
  }): Promise<T> {
    const text = await this.chat({
      ...params,
      temperature: 0.3,
      maxTokens: params.maxTokens || 4096,
    });

    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.error('Failed to parse Claude JSON response', text);
      throw new Error(`Claude returned invalid JSON: ${text.substring(0, 200)}`);
    }
  }
}
