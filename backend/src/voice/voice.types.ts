export interface StartSessionRequest {
  session_type: 'onboarding' | 'exploration';
  user_id?: string;
}

export interface StartSessionResponse {
  session_id: string;
  conversation_token: string;
  agent_id: string;
}

export interface ElevenLabsPostCallPayload {
  type: string;
  event_timestamp: number;
  data: {
    agent_id: string;
    conversation_id: string;
    status: string;
    transcript: Array<{
      role: 'agent' | 'user';
      message: string;
      time_in_call_secs: number;
    }>;
    metadata: {
      start_time_unix_secs: number;
      call_duration_secs: number;
    };
    analysis?: {
      transcript_summary?: string;
      call_successful?: string;
    };
    conversation_initiation_client_data?: {
      dynamic_variables?: Record<string, string>;
    };
  };
}

export interface VoiceSession {
  id: string;
  userId?: string;
  sessionType: string;
  elevenlabsConversationId?: string;
  status: 'active' | 'completed' | 'failed';
  transcript?: string;
  messages?: Array<{
    role: string;
    content: string;
    time_in_call_secs?: number;
  }>;
  createdAt: Date;
  endedAt?: Date;
}
