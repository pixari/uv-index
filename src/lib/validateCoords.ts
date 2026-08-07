export type Coords = { lat: number; lon: number };

/**
 * Parses and validates lat/lon query params before they get interpolated
 * into an upstream API URL. Rejects missing, non-numeric, non-finite
 * (Infinity/NaN survive `Number()` on some inputs), and out-of-range
 * values rather than forwarding whatever a caller sent.
 */
export function parseCoords(searchParams: URLSearchParams): Coords | null {
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");
  if (!latRaw || !lonRaw) return null;

  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return { lat, lon };
}
