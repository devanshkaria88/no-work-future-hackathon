'use client';

interface DemandPulseProps {
  query: string;
}

export default function DemandPulse({ query }: DemandPulseProps) {
  return (
    <div className="relative group cursor-pointer" title={query}>
      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-6 h-6 rounded-full border-2 border-red-500 demand-pulse-ring"
          style={{ animationDelay: '0s' }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-6 h-6 rounded-full border-2 border-red-500 demand-pulse-ring"
          style={{ animationDelay: '0.7s' }}
        />
      </div>

      {/* Center dot */}
      <div className="w-3 h-3 rounded-full bg-red-500 relative z-10" />

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="bg-nes-dark border-2 border-red-500 px-3 py-1.5 text-xs text-white whitespace-nowrap max-w-[200px] truncate">
          {query}
        </div>
      </div>
    </div>
  );
}
