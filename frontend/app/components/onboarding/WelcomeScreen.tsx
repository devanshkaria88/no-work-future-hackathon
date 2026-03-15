'use client';

import { motion } from 'framer-motion';
import PixelCharacter from '../shared/PixelCharacter';

interface WelcomeScreenProps {
  onTalk: () => void;
  onType: () => void;
  onExplore: () => void;
}

export default function WelcomeScreen({ onTalk, onType, onExplore }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-[70] bg-[#0a0a0a] flex items-center justify-center">
      <motion.div
        className="w-full max-w-lg mx-4 border-4 border-agent-companion bg-[#0d0d1a] p-8"
        style={{ imageRendering: 'pixelated' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title */}
        <div className="text-center mb-6">
          <motion.p
            className="font-pixel text-xs text-agent-companion mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ★ W E L C O M E &nbsp; T O ★
          </motion.p>

          <motion.h1
            className="font-pixel text-3xl text-white tracking-widest mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            BOROUGH
          </motion.h1>

          <motion.p
            className="text-white/50 text-sm mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            London&apos;s post-work micro-economy
          </motion.p>

          <motion.p
            className="text-white/40 text-xs mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Your skills. Your neighbors. Your income.
          </motion.p>
        </div>

        {/* Companion avatar */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <PixelCharacter agent="companion" size="lg" animate />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <button
            onClick={onTalk}
            className="w-full px-6 py-3 border-2 border-agent-companion text-agent-companion hover:bg-agent-companion/10 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>🔊</span> Talk to Borough
          </button>

          <button
            onClick={onType}
            className="w-full px-6 py-3 border-2 border-nes-border text-white/70 hover:border-white/40 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>⌨️</span> Type instead
          </button>

          <button
            onClick={onExplore}
            className="w-full px-6 py-3 border-2 border-nes-border text-white/70 hover:border-white/40 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>🗺️</span> Explore the map
          </button>
        </motion.div>

        {/* Hackathon credit */}
        <motion.p
          className="text-center text-white/20 text-[10px] mt-6 font-pixel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          Define The Future of (No) Work — March 2026
        </motion.p>
      </motion.div>
    </div>
  );
}
