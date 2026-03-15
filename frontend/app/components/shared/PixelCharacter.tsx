'use client';

import Image from 'next/image';
import { AgentType, AGENTS } from '../../lib/agents';

interface PixelCharacterProps {
  agent: AgentType;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const SIZES = { sm: 32, md: 48, lg: 64 };

export default function PixelCharacter({ agent, size = 'md', animate = false, className = '' }: PixelCharacterProps) {
  const def = AGENTS[agent];
  const px = SIZES[size];

  return (
    <div
      className={`inline-flex items-center justify-center ${animate ? 'animate-bounce-sm' : ''} ${className}`}
      style={{
        width: px,
        height: px,
        imageRendering: 'pixelated',
      }}
    >
      <Image
        src={def.sprite}
        alt={def.name}
        width={px}
        height={px}
        className="object-contain"
        style={{ imageRendering: 'pixelated' }}
        unoptimized
      />
    </div>
  );
}
