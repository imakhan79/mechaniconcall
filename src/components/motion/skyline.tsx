export function GulfSkyline({ className = "" }: { className?: string }) {
  const buildings: { x: number; w: number; h: number }[] = [
    { x: 0, w: 34, h: 60 },
    { x: 36, w: 22, h: 90 },
    { x: 60, w: 28, h: 70 },
    { x: 92, w: 18, h: 120 },
    { x: 114, w: 30, h: 85 },
    { x: 148, w: 20, h: 140 },
    { x: 172, w: 26, h: 100 },
    { x: 202, w: 16, h: 65 },
    { x: 222, w: 24, h: 160 },
    { x: 250, w: 18, h: 110 },
    { x: 272, w: 32, h: 75 },
    { x: 308, w: 20, h: 200 },
    { x: 332, w: 26, h: 130 },
    { x: 362, w: 18, h: 95 },
    { x: 384, w: 30, h: 150 },
    { x: 418, w: 22, h: 80 },
    { x: 444, w: 26, h: 115 },
    { x: 474, w: 18, h: 65 },
  ];

  return (
    <svg viewBox="0 0 500 220" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="skyline-glow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--warning)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--warning)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="skyline-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--background)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--background)" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect x="0" y="120" width="500" height="60" fill="url(#skyline-glow)" />

      {buildings.map((b, i) => (
        <rect key={i} x={b.x} y={220 - b.h} width={b.w} height={b.h} fill="currentColor" opacity={0.5 + (i % 3) * 0.1} />
      ))}

      {/* central spire, evoking a tall Gulf landmark tower */}
      <polygon points="238,220 246,40 250,10 254,40 262,220" fill="currentColor" opacity="0.85" />

      <rect x="0" y="160" width="500" height="60" fill="url(#skyline-fade)" />
    </svg>
  );
}
