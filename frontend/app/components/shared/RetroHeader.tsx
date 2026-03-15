'use client';

import { useBoroughStore } from '../../stores/borough.store';
import { getLevelForXP } from '../../lib/constants';

export default function RetroHeader() {
  const user = useBoroughStore((s) => s.user);
  const xp = useBoroughStore((s) => s.xp);
  const levelInfo = getLevelForXP(xp);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-nes-dark/95 border-b-2 border-nes-border backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="font-pixel text-sm text-agent-companion">★</span>
        <span className="font-pixel text-xs text-white tracking-wider">BOROUGH</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/70">
        <span>📍 London</span>
        {user && (
          <span className="text-white/40 ml-2">· {user.name}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {xp > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-agent-companion">
              Lv{levelInfo.level}
            </span>
            <div className="w-16 h-2 bg-black/50 border border-nes-border overflow-hidden">
              <div
                className="h-full bg-agent-companion transition-all duration-500"
                style={{ width: `${levelInfo.progress * 100}%` }}
              />
            </div>
            <span className="font-pixel text-[10px] text-white/50">{xp}XP</span>
          </div>
        )}
      </div>
    </header>
  );
}
