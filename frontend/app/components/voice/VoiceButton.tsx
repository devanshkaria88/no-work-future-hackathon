'use client';

import { useState, useCallback } from 'react';
import PixelCharacter from '../shared/PixelCharacter';

interface VoiceButtonProps {
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export default function VoiceButton({ onActivate, onDeactivate }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);

  const startVoice = useCallback(async () => {
    try {
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        console.warn('ElevenLabs agent ID not configured');
        return;
      }

      setIsListening(true);
      onActivate?.();
    } catch (err) {
      console.error('Failed to start voice:', err);
    }
  }, [onActivate]);

  const stopVoice = useCallback(() => {
    setIsListening(false);
    onDeactivate?.();
  }, [onDeactivate]);

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
      <span>{isListening ? '🔊 Listening...' : '🔊 Talk to Borough'}</span>
    </button>
  );
}
