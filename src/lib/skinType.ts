import type { UvLevel } from "./uvLevel";

// Fitzpatrick skin phototype scale — standard dermatological classification
// used to estimate burn time / reapplication interval relative to UV index.
export type SkinType = 1 | 2 | 3 | 4 | 5 | 6;

export const SKIN_TYPES: SkinType[] = [1, 2, 3, 4, 5, 6];

// Illustrative skin-tone swatches for the Fitzpatrick scale picker — a
// visual aid for recognition, not a precise or exhaustive representation.
export const SKIN_TONE_SWATCH: Record<SkinType, string> = {
  1: "#F6D7C4",
  2: "#EAC1A0",
  3: "#D9A57C",
  4: "#B67D53",
  5: "#8B5A34",
  6: "#4A2E1E",
};

// Base minutes to erythema (sunburn onset) at UV index 1, per Fitzpatrick
// type — from the same dermatological literature the Fitzpatrick scale
// itself comes from (Fitzpatrick 1988; commonly tabulated alongside it).
// Actual time scales inversely with current UV index.
export const BASE_BURN_MINUTES: Record<SkinType, number> = {
  1: 67,
  2: 100,
  3: 200,
  4: 300,
  5: 400,
  6: 500,
};

/** Minutes until sunburn risk at the given UV index, for a skin type. */
export function burnMinutes(skinType: SkinType, uv: number): number | null {
  if (uv <= 0) return null;
  return Math.round(BASE_BURN_MINUTES[skinType] / uv);
}

/**
 * Maps a burn-time estimate onto the same 5-tier palette the rest of the
 * app uses for current UV risk — reused here as "burn urgency" rather than
 * inventing a second color scale for the burn-time heatmap on /learn.
 */
export function burnUrgencyLevel(minutes: number): UvLevel {
  if (minutes < 15) return "extreme";
  if (minutes < 30) return "veryHigh";
  if (minutes < 60) return "high";
  if (minutes < 120) return "moderate";
  return "low";
}
