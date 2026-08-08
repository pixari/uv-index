export type UvLevel = "low" | "moderate" | "high" | "veryHigh" | "extreme";

export function uvLevel(uv: number): UvLevel {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  if (uv < 11) return "veryHigh";
  return "extreme";
}

/** Official WHO Global Solar UV Index scale colors. Reference-bar use only —
 * several (moderate especially) fail contrast as text/large fills on white. */
export const WHO_LEVEL_COLOR: Record<UvLevel, string> = {
  low: "#3EA72D",
  moderate: "#FFF300",
  high: "#F18B00",
  veryHigh: "#E53210",
  extreme: "#B567A4",
};

/** Deepened variants of the WHO colors, legible as large text on pure white. */
export const RISK_TEXT_COLOR: Record<UvLevel, string> = {
  low: "oklch(0.5 0.15 145)",
  moderate: "oklch(0.55 0.14 90)",
  high: "oklch(0.58 0.18 55)",
  veryHigh: "oklch(0.52 0.2 25)",
  extreme: "oklch(0.42 0.15 320)",
};

/** Boundary UV values for the reference scale, for positioning a marker. */
export const UV_SCALE_MAX = 12;

/**
 * Full-bleed sky gradients, one per risk level — Apple Weather style: the
 * background itself carries the condition instead of a colored number on a
 * white card. Top/bottom stops are both verified ≥4.5:1 against white text
 * (see scripts note in PROJECT history), so white text stays legible
 * anywhere on the gradient, not just at the bottom.
 */
const RISK_GRADIENT: Record<UvLevel, { top: string; bottom: string }> = {
  low: { top: "oklch(0.53 0.1 220)", bottom: "oklch(0.26 0.09 240)" },
  moderate: { top: "oklch(0.55 0.13 85)", bottom: "oklch(0.28 0.11 55)" },
  high: { top: "oklch(0.52 0.16 55)", bottom: "oklch(0.26 0.14 30)" },
  veryHigh: { top: "oklch(0.46 0.19 25)", bottom: "oklch(0.22 0.15 15)" },
  extreme: { top: "oklch(0.38 0.15 325)", bottom: "oklch(0.18 0.12 310)" },
};

/** Neutral sky shown before the first reading arrives (loading/error). */
const NEUTRAL_GRADIENT = { top: "oklch(0.4 0.02 240)", bottom: "oklch(0.2 0.02 240)" };

export function skyGradientCss(level: UvLevel | null): string {
  const { top, bottom } = level ? RISK_GRADIENT[level] : NEUTRAL_GRADIENT;
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
}
