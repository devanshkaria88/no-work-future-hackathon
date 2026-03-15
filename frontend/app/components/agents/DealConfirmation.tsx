'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBoroughStore } from '../../stores/borough.store';
import PixelCharacter from '../shared/PixelCharacter';
import ConfettiEffect from '../shared/ConfettiEffect';

export default function DealConfirmation() {
  const isOpen = useBoroughStore((s) => s.isDealDialogOpen);
  const dealTerms = useBoroughStore((s) => s.dealTerms);
  const setOpen = useBoroughStore((s) => s.setDealDialogOpen);
  const clearNegotiation = useBoroughStore((s) => s.clearNegotiation);
  const addAgentActivity = useBoroughStore((s) => s.addAgentActivity);
  const [showConfetti, setShowConfetti] = useState(false);

  if (!dealTerms) return null;

  function handleApprove() {
    setShowConfetti(true);
    addAgentActivity({
      id: `deal-${Date.now()}`,
      agent: 'matchmaker',
      action: 'celebration',
      text: '★ DEAL CONFIRMED!',
      type: 'celebration',
      timestamp: Date.now(),
    });
    setTimeout(() => {
      setOpen(false);
      clearNegotiation();
      setShowConfetti(false);
    }, 3000);
  }

  function handleDecline() {
    setOpen(false);
    clearNegotiation();
  }

  return (
    <>
      <ConfettiEffect active={showConfetti} />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0d0d1a] border-4 border-agent-companion w-full max-w-md mx-4"
              style={{ imageRendering: 'pixelated' }}
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              {/* Title */}
              <div className="text-center py-4 border-b-2 border-nes-border">
                <span className="font-pixel text-sm text-agent-companion">
                  ★ ★ ★ DEAL CONFIRMED! ★ ★ ★
                </span>
              </div>

              {/* Deal details */}
              <div className="p-6">
                <div className="bg-black/30 border-2 border-nes-border p-4 mb-4">
                  <h3 className="text-white font-bold text-lg mb-3">
                    {dealTerms.listingTitle}
                  </h3>

                  {dealTerms.location && (
                    <p className="text-white/70 text-sm mb-1">
                      📍 {dealTerms.location}
                    </p>
                  )}
                  {dealTerms.agreedTime && (
                    <p className="text-white/70 text-sm mb-1">
                      📅 {dealTerms.agreedTime}
                    </p>
                  )}
                  <p className="text-white/70 text-sm mb-3">
                    👥 {dealTerms.quantity} guest{dealTerms.quantity > 1 ? 's' : ''} × £
                    {dealTerms.pricePerPerson} = £{dealTerms.total}
                  </p>

                  {/* Agents facing each other */}
                  <div className="flex items-center justify-center gap-6 py-3">
                    <PixelCharacter agent="buyerNegotiator" size="md" animate />
                    <span className="text-2xl">🤝</span>
                    <PixelCharacter agent="sellerNegotiator" size="md" animate />
                  </div>

                  {dealTerms.specialConditions && dealTerms.specialConditions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-nes-border">
                      <p className="text-white/50 text-xs mb-1">Agreed extras:</p>
                      {dealTerms.specialConditions.map((c, i) => (
                        <p key={i} className="text-white/70 text-xs">• {c}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDecline}
                    className="flex-1 px-4 py-3 border-2 border-nes-border text-white/60 font-pixel text-[10px] hover:bg-white/5 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 px-4 py-3 border-2 border-green-500 text-green-400 font-pixel text-[10px] hover:bg-green-500/20 transition-colors"
                  >
                    ✓ Approve
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
