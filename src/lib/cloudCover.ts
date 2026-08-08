// MET Norway reports cloud_area_fraction as a percentage (0–100). Bucketed
// the same way uvLevel.ts buckets UV — a handful of named levels a person
// reads at a glance beats a bare percentage next to the UV number.

type CloudCoverLevel = "clear" | "partlyCloudy" | "mostlyCloudy" | "cloudy";

export function cloudCoverLevel(percent: number): CloudCoverLevel {
  if (percent < 20) return "clear";
  if (percent < 50) return "partlyCloudy";
  if (percent < 80) return "mostlyCloudy";
  return "cloudy";
}
