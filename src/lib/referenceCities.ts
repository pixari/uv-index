// Fixed comparison points for "your UV vs. the world" — deliberately
// diverse rather than random: an equatorial sea-level city, an equatorial
// high-altitude city (ties to the altitude fact elsewhere on /learn), a
// high-altitude mid-latitude city (same reason), and a near-polar one.
export type ReferenceCity = {
  key: string;
  lat: number;
  lon: number;
};

export const REFERENCE_CITIES: ReferenceCity[] = [
  { key: "singapore", lat: 1.3521, lon: 103.8198 },
  { key: "nairobi", lat: -1.2921, lon: 36.8219 },
  { key: "denver", lat: 39.7392, lon: -104.9903 },
  { key: "reykjavik", lat: 64.1466, lon: -21.9426 },
];
