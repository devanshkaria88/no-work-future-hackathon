'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useBoroughStore } from '../../stores/borough.store';
import { CATEGORY_COLORS } from '../../lib/constants';
import { API_URL } from '../../lib/constants';

export default function ListingPopup() {
  const bubble = useBoroughStore((s) => s.selectedBubble);
  const setSelected = useBoroughStore((s) => s.setSelectedBubble);
  const addAgentActivity = useBoroughStore((s) => s.addAgentActivity);

  if (!bubble || bubble.type !== 'supply') return null;

  const color = CATEGORY_COLORS[bubble.category] || CATEGORY_COLORS.default;
  const spotsLeft = bubble.capacity ? bubble.capacity - (bubble.booked || 0) : null;

  function handleInterested() {
    addAgentActivity({
      id: `interest-${Date.now()}`,
      agent: 'matchmaker',
      action: 'matching',
      text: `Looking for matches for "${bubble!.title}"...`,
      type: 'working',
      timestamp: Date.now(),
    });

    // Trigger match on backend (best-effort)
    fetch(`${API_URL}/demo/trigger-match?listingId=${bubble!.id}`, {
      method: 'POST',
    }).catch(() => {});

    setSelected(null);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelected(null)}
      >
        <motion.div
          className="bg-[#0d0d1a] border-4 w-full max-w-sm mx-4"
          style={{ borderColor: color, imageRendering: 'pixelated' }}
          initial={{ scale: 0.9, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <div className="px-5 pt-4 pb-3 border-b-2 border-nes-border">
            <h3 className="text-white font-bold text-lg">{bubble.title}</h3>
          </div>

          {/* Details */}
          <div className="p-5 space-y-2">
            {bubble.userName && (
              <p className="text-white/70 text-sm">🧑‍🍳 Hosted by {bubble.userName}</p>
            )}
            <p className="text-white/70 text-sm">
              📍 {bubble.category.charAt(0).toUpperCase() + bubble.category.slice(1)}
            </p>
            {bubble.price && (
              <p className="text-white/70 text-sm">💰 £{bubble.price} per person</p>
            )}
            {spotsLeft !== null && (
              <p className="text-white/70 text-sm">
                👥 {spotsLeft}/{bubble.capacity} spots left
              </p>
            )}
            {bubble.timeSlot && (
              <p className="text-white/70 text-sm">📅 {bubble.timeSlot}</p>
            )}

            {bubble.description && (
              <p className="text-white/60 text-sm mt-3 leading-relaxed">
                {bubble.description}
              </p>
            )}

            {bubble.tags && bubble.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {bubble.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs border"
                    style={{ borderColor: color, color }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t-2 border-nes-border">
            <button
              onClick={() => setSelected(null)}
              className="flex-1 px-3 py-2 border-2 border-nes-border text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleInterested}
              className="flex-1 px-3 py-2 border-2 text-sm hover:opacity-80 transition-opacity"
              style={{ borderColor: color, color }}
            >
              💘 I&apos;m interested
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
