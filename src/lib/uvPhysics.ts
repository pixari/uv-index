// Real figures from the WHO/WMO/UNEP/ICNIRP "Global Solar UV Index: A
// Practical Guide" — the same primary source already cited elsewhere in
// this app (see LearnClient's methodology article). Not estimated.

export type ReflectiveSurface = { key: string; percent: number };

// UV reflected back up at a person, by surface — this is why shade alone
// doesn't fully protect you near snow or water: a meaningful fraction of
// exposure comes from below, not just directly overhead.
export const UV_REFLECTANCE: ReflectiveSurface[] = [
  { key: "freshSnow", percent: 80 },
  { key: "seaFoam", percent: 25 },
  { key: "drySand", percent: 15 },
  { key: "concrete", percent: 10 },
  { key: "grassSoil", percent: 3 },
];

// UV intensity increases roughly this much per 1000m of altitude, since
// there's less atmosphere to filter it — independent of latitude/season.
export const UV_INCREASE_PERCENT_PER_1000M = 10;

export const UV_PHYSICS_SOURCE_URL = "https://www.who.int/publications/i/item/9241590076";
