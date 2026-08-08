// Open-Meteo Air Quality API — free, no key, same provider family already
// used for geocoding (geocoding-api.open-meteo.com). Returns the current
// European AQI for a point; see airQuality.ts for turning that number
// into a named level.
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

/** Fetches the current European AQI for a point. Returns null (never throws) on any upstream failure. */
export async function fetchCurrentAqi(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(
      `${AIR_QUALITY_URL}?latitude=${lat}&longitude=${lon}&current=european_aqi`,
      { next: { revalidate: 1800 } }, // same cadence as the UV/weather fetch — air quality doesn't change faster
    );
    if (!res.ok) return null;
    const data = await res.json();
    const value = data?.current?.european_aqi;
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}
