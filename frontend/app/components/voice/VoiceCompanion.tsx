'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCharacter from '../shared/PixelCharacter';
import { useBoroughStore } from '../../stores/borough.store';
import { API_URL } from '../../lib/constants';

export default function VoiceCompanion() {
  const voiceStatus = useBoroughStore((s) => s.voiceStatus);
  const setVoiceStatus = useBoroughStore((s) => s.setVoiceStatus);
  const addVoiceTranscript = useBoroughStore((s) => s.addVoiceTranscript);
  const user = useBoroughStore((s) => s.user);
  const addAgentActivity = useBoroughStore((s) => s.addAgentActivity);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const startingRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Borough Voice] Connected');
      setVoiceStatus('connected');
      addAgentActivity({
        id: `voice-connected-${Date.now()}`,
        agent: 'companion',
        action: 'connected',
        text: 'Voice companion connected — say something!',
        type: 'success',
        timestamp: Date.now(),
      });
    },
    onDisconnect: () => {
      console.log('[Borough Voice] Disconnected');
      setVoiceStatus('idle');
      setIsSpeaking(false);
      startingRef.current = false;
    },
    onMessage: (message) => {
      try {
        if (message?.source === 'ai' && message?.message) {
          setLastMessage(message.message);
          addVoiceTranscript({ role: 'agent', text: message.message });
        } else if (message?.source === 'user' && message?.message) {
          addVoiceTranscript({ role: 'user', text: message.message });
        }
      } catch (e) {
        console.warn('[Borough Voice] Message handler error:', e);
      }
    },
    onError: (error) => {
      console.warn('[Borough Voice] Error event:', error);
      setVoiceStatus('error');
      startingRef.current = false;
      setTimeout(() => setVoiceStatus('idle'), 3000);
    },
    onModeChange: (mode) => {
      try {
        setIsSpeaking(mode?.mode === 'speaking');
      } catch {
        // ignore
      }
    },
    onStatusChange: (status) => {
      console.log('[Borough Voice] Status:', status);
    },
  });

  const startVoice = useCallback(async () => {
    if (startingRef.current || voiceStatus === 'connected') return;
    startingRef.current = true;

    try {
      setVoiceStatus('connecting');

      // Request mic permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        console.error('[Borough Voice] Microphone access denied:', micErr);
        setVoiceStatus('error');
        startingRef.current = false;
        addAgentActivity({
          id: `voice-mic-error-${Date.now()}`,
          agent: 'companion',
          action: 'error',
          text: 'Microphone access denied — please allow mic access',
          type: 'working',
          timestamp: Date.now(),
        });
        setTimeout(() => setVoiceStatus('idle'), 3000);
        return;
      }

      const res = await fetch(`${API_URL}/voice/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_type: 'map_exploration',
          user_id: user?.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`start-session returned ${res.status}`);
      }

      const { conversation_token, agent_id } = await res.json();
      console.log('[Borough Voice] Got token, starting session...');

      if (conversation_token) {
        await conversation.startSession({
          conversationToken: conversation_token,
        });
      } else if (agent_id) {
        await conversation.startSession({
          agentId: agent_id,
          connectionType: 'webrtc',
        });
      } else {
        throw new Error('No conversation_token or agent_id returned');
      }

      console.log('[Borough Voice] Session started');
    } catch (err) {
      console.error('[Borough Voice] Failed to start:', err);
      setVoiceStatus('error');
      startingRef.current = false;
      addAgentActivity({
        id: `voice-error-${Date.now()}`,
        agent: 'companion',
        action: 'error',
        text: `Voice connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'working',
        timestamp: Date.now(),
      });
      setTimeout(() => setVoiceStatus('idle'), 3000);
    }
  }, [voiceStatus, setVoiceStatus, user, conversation, addAgentActivity, addVoiceTranscript]);

  const stopVoice = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // ignore
    }
    setVoiceStatus('idle');
    setIsSpeaking(false);
    startingRef.current = false;
  }, [conversation, setVoiceStatus]);

  // Catch unhandled SDK errors at window level
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event.message?.includes('error_type') || event.message?.includes('handleErrorEvent')) {
        console.warn('[Borough Voice] Suppressed SDK error:', event.message);
        event.preventDefault();
        setVoiceStatus('error');
        startingRef.current = false;
        setTimeout(() => setVoiceStatus('idle'), 3000);
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, [setVoiceStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      conversation.endSession().catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = voiceStatus === 'connected' || voiceStatus === 'connecting';

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {lastMessage && voiceStatus === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="max-w-[240px] bg-nes-dark border-2 border-agent-companion px-3 py-2 text-xs text-white/90 leading-relaxed"
            key="msg"
          >
            {lastMessage.length > 100
              ? lastMessage.slice(0, 100) + '...'
              : lastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voiceStatus !== 'idle' && voiceStatus !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-nes-dark border-2 border-agent-companion px-3 py-1.5 text-xs text-white/80"
            key="status"
          >
            {voiceStatus === 'connecting' && '🎙️ Connecting...'}
            {voiceStatus === 'error' && '❌ Voice unavailable'}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={isActive ? stopVoice : startVoice}
        className={`relative flex items-center justify-center w-14 h-14 border-4 transition-all duration-200 ${
          isActive
            ? 'border-agent-companion bg-agent-companion/20'
            : 'border-nes-border bg-nes-dark hover:border-agent-companion/60'
        } ${isSpeaking ? 'animate-pulse-glow' : ''}`}
        style={{ imageRendering: 'pixelated' as const }}
        title={isActive ? 'Stop voice chat' : 'Start voice chat'}
      >
        <PixelCharacter
          agent="companion"
          size="sm"
          animate={isActive}
        />

        {voiceStatus === 'connected' && (
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
            isSpeaking ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'
          }`} />
        )}

        {voiceStatus === 'connecting' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-ping" />
        )}
      </button>
    </div>
  );
}
