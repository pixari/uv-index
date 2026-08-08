// Last-known-good UV reading, kept purely so a network hiccup or an
// offline moment shows a labeled-stale number instead of a blank error —
// exactly the situation (outdoors, patchy signal) this app is built for.

const CACHE_KEY = "uv-index:last-reading";

type UvReading = {
  lat: number;
  lon: number;
  uv: number;
  updatedAt: string | null;
  safeAfter: string | null;
  fetchedAt: number;
  // Added later — optional so reading a value cached before this field
  // existed doesn't need its own migration, just a `?? null` at read time.
  temperature?: number | null;
  cloudCover?: number | null;
  aqi?: number | null;
};

// ~1.1km grid — "close enough to call it the same place" without requiring
// an exact float match against whatever precision the coordinates came in
// at (GPS vs. a saved/searched place).
function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function setCachedUv(reading: UvReading) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(reading));
}

/** Returns the last cached reading if it's roughly for this place, else null. */
export function getCachedUv(lat: number, lon: number): UvReading | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const reading = JSON.parse(raw) as UvReading;
    if (round(reading.lat) !== round(lat) || round(reading.lon) !== round(lon)) {
      return null;
    }
    return reading;
  } catch {
    return null;
  }
}
