"use client";

import type { OzonePoint } from "@/lib/ozoneData";

const WIDTH = 320;
const HEIGHT = 160;
const PADDING = { top: 10, right: 10, bottom: 22, left: 30 };

export default function OzoneChart({ points }: { points: OzonePoint[] }) {
  if (points.length < 2) return null;

  const minYear = points[0].year;
  const maxYear = points[points.length - 1].year;
  const maxArea = Math.max(...points.map((p) => p.areaMillionKm2));
  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (year: number) => PADDING.left + ((year - minYear) / (maxYear - minYear)) * plotW;
  const y = (area: number) => PADDING.top + plotH - (area / maxArea) * plotH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.year)} ${y(p.areaMillionKm2)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full max-w-sm"
      role="img"
      aria-label="Antarctic ozone hole maximum area by year, million square kilometers"
    >
      <text x={PADDING.left - 6} y={PADDING.top + plotH} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
        0
      </text>
      <text x={PADDING.left - 6} y={PADDING.top + 8} fontSize={9} fill="var(--muted-foreground)" textAnchor="end">
        {Math.ceil(maxArea)}M km²
      </text>

      <path
        d={linePath}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p) => (
        <circle key={p.year} cx={x(p.year)} cy={y(p.areaMillionKm2)} r={2.5} fill="var(--brand)" />
      ))}
      {points.map((p, i) =>
        i === 0 || i === points.length - 1 || i % 2 === 0 ? (
          <text
            key={p.year}
            x={x(p.year)}
            y={HEIGHT - 6}
            fontSize={9}
            fill="var(--muted-foreground)"
            textAnchor="middle"
          >
            {p.year}
          </text>
        ) : null,
      )}
    </svg>
  );
}
