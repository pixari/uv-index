export type UvLevel = "low" | "moderate" | "high" | "veryHigh" | "extreme";

export function uvLevel(uv: number): UvLevel {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  if (uv < 11) return "veryHigh";
  return "extreme";
}

export const UV_LEVEL_COLOR: Record<UvLevel, string> = {
  low: "#3EA72D",
  moderate: "#FFF300",
  high: "#F18B00",
  veryHigh: "#E53210",
  extreme: "#B567A4",
};
