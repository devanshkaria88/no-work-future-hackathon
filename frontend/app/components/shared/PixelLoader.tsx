'use client';

export default function PixelLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-white"
            style={{
              imageRendering: 'pixelated',
              animation: `bounce 0.6s ${i * 0.15}s infinite alternate`,
            }}
          />
        ))}
      </div>
      <p className="font-pixel text-xs text-white/70">{text}</p>
      <style jsx>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
