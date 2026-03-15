'use client';

import { useState, useEffect, useRef } from 'react';
import PixelCharacter from '../shared/PixelCharacter';

interface AgentMessageProps {
  agent: 'buyer' | 'seller';
  message: string;
  agentName: string;
  agentColor: string;
  animate?: boolean;
  onTypingComplete?: () => void;
}

const CHAR_DELAY = 30;
const PUNCTUATION_DELAY = 100;

export default function AgentMessage({
  agent,
  message,
  agentName,
  agentColor,
  animate = true,
  onTypingComplete,
}: AgentMessageProps) {
  const [displayedText, setDisplayedText] = useState(animate ? '' : message);
  const [isTyping, setIsTyping] = useState(animate);
  const [showBounce, setShowBounce] = useState(animate);
  const charIndex = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!animate) return;

    const bounceTimer = setTimeout(() => setShowBounce(false), 300);

    function typeNext() {
      if (charIndex.current >= message.length) {
        setIsTyping(false);
        onTypingComplete?.();
        return;
      }

      const char = message[charIndex.current];
      charIndex.current++;
      setDisplayedText(message.slice(0, charIndex.current));

      const delay = char === '.' || char === ',' || char === '!' || char === '?'
        ? PUNCTUATION_DELAY
        : CHAR_DELAY;

      timerRef.current = setTimeout(typeNext, delay);
    }

    timerRef.current = setTimeout(typeNext, 200);

    return () => {
      clearTimeout(bounceTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBuyer = agent === 'buyer';
  const agentType = isBuyer ? 'buyerNegotiator' : 'sellerNegotiator';

  return (
    <div className={`flex gap-3 ${isBuyer ? 'flex-row' : 'flex-row-reverse'} items-start mb-4`}>
      <PixelCharacter agent={agentType} size="sm" animate={showBounce} />

      <div className={`flex flex-col max-w-[75%] ${isBuyer ? 'items-start' : 'items-end'}`}>
        <span
          className="font-pixel text-[10px] mb-1 px-1"
          style={{ color: agentColor }}
        >
          {agentName}
        </span>

        <div
          className={`speech-balloon ${isBuyer ? 'balloon-left' : 'balloon-right'}`}
          style={{
            borderColor: agentColor,
            color: agentColor,
            backgroundColor: agentColor + '15',
          }}
        >
          <p className="text-sm text-white/90 leading-relaxed">
            {displayedText}
            {isTyping && (
              <span
                className="typewriter-cursor inline-block w-2 h-4 ml-0.5 align-middle"
                style={{ backgroundColor: agentColor }}
              />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
