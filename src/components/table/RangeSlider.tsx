'use client';

// Dual-thumb range slider over a set of discrete stops (handles non-linear
// domains like price: FREE · $0.5 · $2 · $10+). value is [loIndex, hiIndex].

export function RangeSlider({
  stops,
  value,
  onChange,
  formatValue
}: {
  stops: number[];
  value: [number, number];
  onChange: (v: [number, number]) => void;
  formatValue: (v: number, isLast: boolean) => string;
}) {
  const max = stops.length - 1;
  const [lo, hi] = value;
  const pct = (i: number) => (i / max) * 100;

  return (
    <div className="px-0.5">
      <div className="relative flex h-6 items-center">
        <div className="absolute left-0 right-0 h-1 rounded-full bg-surface-2" />
        <div
          className="absolute h-1 rounded-full bg-brand"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          className="range-thumb"
          style={{ zIndex: lo >= max ? 5 : 3 }}
          aria-label="Minimum"
        />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
          className="range-thumb"
          style={{ zIndex: 4 }}
          aria-label="Maximum"
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[11px] tabular-nums text-muted">
        <span>{formatValue(stops[lo], lo === max)}</span>
        <span>{formatValue(stops[hi], hi === max)}</span>
      </div>
    </div>
  );
}
