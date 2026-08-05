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
