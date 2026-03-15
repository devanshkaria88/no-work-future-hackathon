'use client';

import { useEffect, useState } from 'react';
import { AGENTS, AgentType } from '../../lib/agents';

interface GameNotificationProps {
  agent: AgentType;
  text: string;
  type: 'working' | 'success' | 'negotiation' | 'celebration' | 'xp' | 'levelup';
  onDismiss?: () => void;
  autoDismiss?: number;
}

export default function GameNotification({
  agent,
  text,
  type,
  onDismiss,
  autoDismiss,
}: GameNotificationProps) {
  const [visible, setVisible] = useState(true);
  const def = AGENTS[agent];

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  if (!visible) return null;

  const bgClass = type === 'celebration' || type === 'levelup'
    ? 'bg-gradient-to-r from-yellow-900/80 to-amber-900/80'
    : 'bg-nes-dark/90';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 ${bgClass} border-2 transition-all duration-300`}
      style={{ borderColor: def.color, imageRendering: 'pixelated' }}
    >
      <span className="text-xl flex-shrink-0">{def.emoji}</span>
      <span className="text-sm text-white/90 flex-1">{text}</span>
      {type === 'working' && (
        <span className="text-xs text-white/50 animate-pulse">...</span>
      )}
    </div>
  );
}
