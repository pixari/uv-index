import { WHO_LEVEL_COLOR, UV_SCALE_MAX, type UvLevel } from "@/lib/uvLevel";

const STOPS: { level: UvLevel; upTo: number }[] = [
  { level: "low", upTo: 3 },
  { level: "moderate", upTo: 6 },
  { level: "high", upTo: 8 },
  { level: "veryHigh", upTo: 11 },
  { level: "extreme", upTo: UV_SCALE_MAX },
];

export default function UvScaleBar({ uv }: { uv: number }) {
  const clamped = Math.min(Math.max(uv, 0), UV_SCALE_MAX);
  const markerPct = (clamped / UV_SCALE_MAX) * 100;

  const gradient = STOPS.map(
    (s, i) =>
      `${WHO_LEVEL_COLOR[s.level]} ${((STOPS[i - 1]?.upTo ?? 0) / UV_SCALE_MAX) * 100}%, ${WHO_LEVEL_COLOR[s.level]} ${(s.upTo / UV_SCALE_MAX) * 100}%`,
  ).join(", ");

  return (
    <div className="w-full max-w-xs">
      <div className="relative h-1.5 rounded-full overflow-visible">
        <div
          className="h-full w-full rounded-full"
          style={{ background: `linear-gradient(to right, ${gradient})` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-bg border-2 border-ink shadow-sm transition-[left] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ left: `${markerPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
        <span>0</span>
        <span>{UV_SCALE_MAX}+</span>
      </div>
    </div>
  );
}
