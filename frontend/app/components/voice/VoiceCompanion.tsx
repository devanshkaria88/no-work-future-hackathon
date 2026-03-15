'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCharacter from '../shared/PixelCharacter';

export default function VoiceCompanion() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  async function toggleVoice() {
    if (isActive) {
      setIsActive(false);
      setStatus('idle');
      return;
    }

    try {
      setStatus('connecting');
      setIsActive(true);
      setStatus('connected');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-nes-dark border-2 border-agent-companion px-3 py-1.5 text-xs text-white/80"
          >
            {status === 'connecting' && '🎙️ Connecting...'}
            {status === 'connected' && '🎙️ Listening...'}
            {status === 'error' && '❌ Voice unavailable'}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleVoice}
        className={`relative flex items-center justify-center w-14 h-14 border-4 transition-all duration-200 ${
          isActive
            ? 'border-agent-companion bg-agent-companion/20 animate-pulse-glow'
            : 'border-nes-border bg-nes-dark hover:border-agent-companion/60'
        }`}
        style={{ imageRendering: 'pixelated' as const }}
      >
        <PixelCharacter
          agent="companion"
          size="sm"
          animate={isActive}
        />

        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>
    </div>
  );
}
