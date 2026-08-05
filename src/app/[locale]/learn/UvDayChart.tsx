"use client";

type Point = { time: string; uv: number };

const WIDTH = 320;
const HEIGHT = 140;
const PADDING = { top: 10, right: 10, bottom: 24, left: 22 };

export default function UvDayChart({ points }: { points: Point[] }) {
  if (points.length < 2) return null;

  const maxUv = Math.max(...points.map((p) => p.uv), 3);
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (i: number) => PADDING.left + (i / (points.length - 1)) * plotW;
  const y = (uv: number) => PADDING.top + plotH - (uv / maxUv) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.uv)}`)
    .join(" ");

  const areaPath = `${linePath} L ${x(points.length - 1)} ${PADDING.top + plotH} L ${x(0)} ${PADDING.top + plotH} Z`;

  const now = new Date();
  const nowFraction = (() => {
    const first = new Date(points[0].time).getTime();
    const last = new Date(points[points.length - 1].time).getTime();
    if (now.getTime() < first || now.getTime() > last) return null;
    return (now.getTime() - first) / (last - first);
  })();

  // Label every ~4 hours.
  const labelEvery = Math.max(1, Math.round(points.length / 6));
  const maxUvRounded = Math.ceil(maxUv);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full max-w-sm"
      role="img"
      aria-label="UV index over the course of today"
    >
      {/* Y axis: 0 at the baseline, the day's peak at the top. */}
      <text
        x={PADDING.left - 6}
        y={PADDING.top + plotH}
        fontSize={9}
        fill="var(--muted-foreground)"
        textAnchor="end"
      >
        0
      </text>
      <text
        x={PADDING.left - 6}
        y={PADDING.top + 8}
        fontSize={9}
        fill="var(--muted-foreground)"
        textAnchor="end"
      >
        {maxUvRounded}
      </text>

      <path d={areaPath} fill="var(--brand)" opacity={0.12} />
      <path
        d={linePath}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {nowFraction !== null && (
        <line
          x1={PADDING.left + nowFraction * plotW}
          x2={PADDING.left + nowFraction * plotW}
          y1={PADDING.top}
          y2={PADDING.top + plotH}
          stroke="var(--ink)"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.4}
        />
      )}
      {points.map((p, i) =>
        i % labelEvery === 0 ? (
          <text
            key={p.time}
            x={x(i)}
            y={HEIGHT - 6}
            fontSize={9}
            fill="var(--muted-foreground)"
            textAnchor="middle"
          >
            {new Date(p.time).getHours()}
          </text>
        ) : null,
      )}
    </svg>
  );
}
