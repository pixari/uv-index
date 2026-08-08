import type { SkinType } from "./skinType";

// Average minutes of midday sun exposure (10:00–16:00, the March–October
// active season) needed to produce ~1000 IU of vitamin D, per Fitzpatrick
// type — annual averages for the Mediterranean basin.
//
// Deliberately *not* scaled by the current UV reading the way burnMinutes
// is: that paper's own headline numbers are already averaged over a
// season's worth of UV conditions, not tied to a single reference UV
// index the way Fitzpatrick's burn-time table is (that one's "minutes at
// UV=1" framing is what makes burnMinutes' `/ uv` scaling honest — this
// isn't the same kind of number, and scaling it against today's UV without
// knowing what UV the source averaged over would just be a guess dressed
// up as a calculation). Shown instead as a general per-skin-type fact,
// paired with today's actual (UV-scaled) burn time for context.
export const VITAMIN_D_MINUTES_BY_TYPE: Record<SkinType, number> = {
  1: 5.05,
  2: 6.3,
  3: 7.6,
  4: 11.35,
  5: 15.15,
  6: 25.25,
};

export const VITAMIN_D_SOURCE_URL = "https://www.nature.com/articles/s41598-024-54188-5";

/** Rounded minutes for display — the underlying figure is already an average, not a precise one. */
export function vitaminDMinutes(skinType: SkinType): number {
  return Math.round(VITAMIN_D_MINUTES_BY_TYPE[skinType]);
}
