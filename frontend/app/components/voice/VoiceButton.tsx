'use client';

import { useCallback } from 'react';
import PixelCharacter from '../shared/PixelCharacter';
import { useBoroughStore } from '../../stores/borough.store';
import { API_URL } from '../../lib/constants';
import { useConversation } from '@elevenlabs/react';

interface VoiceButtonProps {
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export default function VoiceButton({ onActivate, onDeactivate }: VoiceButtonProps) {
  const voiceStatus = useBoroughStore((s) => s.voiceStatus);
  const setVoiceStatus = useBoroughStore((s) => s.setVoiceStatus);
  const user = useBoroughStore((s) => s.user);

  const conversation = useConversation({
    onConnect: () => setVoiceStatus('connected'),
    onDisconnect: () => setVoiceStatus('idle'),
    onError: () => {
      setVoiceStatus('error');
      setTimeout(() => setVoiceStatus('idle'), 3000);
    },
  });

  const isListening = voiceStatus === 'connected' || voiceStatus === 'connecting';

  const startVoice = useCallback(async () => {
    if (isListening) return;
    try {
      setVoiceStatus('connecting');
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const res = await fetch(`${API_URL}/voice/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_type: 'onboarding',
          user_id: user?.id,
        }),
      });

      if (!res.ok) throw new Error(`start-session failed: ${res.status}`);

      const { conversation_token, agent_id } = await res.json();

      if (conversation_token) {
        await conversation.startSession({
          conversationToken: conversation_token,
        });
      } else {
        await conversation.startSession({
          agentId: agent_id,
          connectionType: 'webrtc' as const,
        });
      }

      onActivate?.();
    } catch (err) {
      console.error('Failed to start voice:', err);
      setVoiceStatus('error');
      setTimeout(() => setVoiceStatus('idle'), 3000);
    }
  }, [isListening, setVoiceStatus, user, conversation, onActivate]);

  const stopVoice = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch { /* ignore */ }
    setVoiceStatus('idle');
    onDeactivate?.();
  }, [conversation, setVoiceStatus, onDeactivate]);

  return (
    <button
      onClick={isListening ? stopVoice : startVoice}
      className={`flex items-center gap-2 px-4 py-2 border-2 font-pixel text-[10px] transition-all ${
        isListening
          ? 'border-agent-companion text-agent-companion bg-agent-companion/10'
          : 'border-nes-border text-white/60 hover:border-agent-companion/50'
      }`}
    >
      <PixelCharacter agent="companion" size="sm" animate={isListening} />
      <span>
        {voiceStatus === 'connecting'
          ? '🎙️ Connecting...'
          : isListening
            ? '🔊 Listening...'
            : '🔊 Talk to Borough'}
      </span>
    </button>
  );
}
