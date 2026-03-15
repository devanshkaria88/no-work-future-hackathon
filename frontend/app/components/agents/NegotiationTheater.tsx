'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoroughStore } from '../../stores/borough.store';
import AgentMessage from './AgentMessage';
import PixelCharacter from '../shared/PixelCharacter';

export default function NegotiationTheater() {
  const isOpen = useBoroughStore((s) => s.isNegotiationTheaterOpen);
  const messages = useBoroughStore((s) => s.negotiationMessages);
  const negotiation = useBoroughStore((s) => s.activeNegotiation);
  const clearNegotiation = useBoroughStore((s) => s.clearNegotiation);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [typingIndex, setTypingIndex] = useState(-1);

  // Track which messages have finished typing
  useEffect(() => {
    if (messages.length > 0 && typingIndex < messages.length - 1) {
      setTypingIndex(messages.length - 1);
    }
  }, [messages.length, typingIndex]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, typingIndex]);

  const statusLabel = negotiation?.status === 'deal-reached'
    ? '★ DEAL REACHED!'
    : negotiation?.status === 'abandoned'
    ? 'Negotiation ended'
    : negotiation?.status === 'connecting'
    ? 'Connecting agents...'
    : '⚔️ NEGOTIATION IN PROGRESS';

  const statusColor = negotiation?.status === 'deal-reached'
    ? 'text-green-400'
    : negotiation?.status === 'abandoned'
    ? 'text-red-400'
    : 'text-agent-companion';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d1a] border-t-4 border-agent-companion"
          style={{ height: '42vh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-nes-border">
            <div className="flex items-center gap-3">
              <PixelCharacter agent="buyerNegotiator" size="sm" />
              <span className={`font-pixel text-[10px] ${statusColor}`}>
                {statusLabel}
              </span>
              <PixelCharacter agent="sellerNegotiator" size="sm" />
            </div>

            <button
              onClick={clearNegotiation}
              className="text-white/40 hover:text-white text-xs px-2 py-1 border border-nes-border hover:border-white/40 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 negotiation-scroll"
            style={{ height: 'calc(42vh - 100px)' }}
          >
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <PixelCharacter agent="buyerNegotiator" size="md" animate />
                    <span className="font-pixel text-xs text-white/30">vs</span>
                    <PixelCharacter agent="sellerNegotiator" size="md" animate />
                  </div>
                  <p className="font-pixel text-[10px] text-white/40">
                    Connecting agents...
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <AgentMessage
                key={msg.id}
                agent={msg.from}
                message={msg.message}
                agentName={msg.agentName}
                agentColor={msg.agentColor}
                animate={i === typingIndex}
                onTypingComplete={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  }
                }}
              />
            ))}

            {negotiation?.status === 'deal-reached' && (
              <div className="flex items-center justify-center gap-4 mt-4 py-3 border-2 border-green-500/30 bg-green-500/10">
                <PixelCharacter agent="buyerNegotiator" size="sm" animate />
                <span className="font-pixel text-xs text-green-400">🤝</span>
                <PixelCharacter agent="sellerNegotiator" size="sm" animate />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-nes-border">
            <button className="px-4 py-2 border-2 border-agent-buyer text-agent-buyer font-pixel text-[10px] hover:bg-agent-buyer/20 transition-colors">
              🗣️ Jump in
            </button>
            <button className="px-4 py-2 border-2 border-nes-border text-white/60 font-pixel text-[10px] hover:bg-white/5 transition-colors">
              🤖 Let them talk
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
