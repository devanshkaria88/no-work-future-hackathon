'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#EF9F27', '#378ADD', '#1D9E75', '#7F77DD', '#D85A30', '#FAC775', '#E24B4A', '#97C459'];

interface ConfettiEffectProps {
  active: boolean;
  duration?: number;
}

export default function ConfettiEffect({ active, duration = 3000 }: ConfettiEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const pieces: HTMLDivElement[] = [];
    const count = 60;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      piece.style.animationDelay = `${Math.random() * 0.8}s`;
      containerRef.current.appendChild(piece);
      pieces.push(piece);
    }

    const timer = setTimeout(() => {
      pieces.forEach((p) => p.remove());
    }, duration);

    return () => {
      clearTimeout(timer);
      pieces.forEach((p) => p.remove());
    };
  }, [active, duration]);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50" />;
}
