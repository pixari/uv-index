// Open-Meteo's Air Quality API (open-meteo.com/en/docs/air-quality-api)
// returns a `european_aqi` field — their own single-number composite of
// the EEA's European Air Quality Index (which itself has no single
// numeric scale; it's normally reported as six discrete pollutant-
// concentration bands). Open-Meteo's own documented mapping from that
// composite number to the six EEA category names is what's bucketed here.
export type AqiLevel = "good" | "fair" | "moderate" | "poor" | "veryPoor" | "extremelyPoor";

export function aqiLevel(europeanAqi: number): AqiLevel {
  if (europeanAqi < 20) return "good";
  if (europeanAqi < 40) return "fair";
  if (europeanAqi < 60) return "moderate";
  if (europeanAqi < 80) return "poor";
  if (europeanAqi < 100) return "veryPoor";
  return "extremelyPoor";
}
