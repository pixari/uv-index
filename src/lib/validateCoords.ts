export type Coords = { lat: number; lon: number };

/**
 * Rejects missing, non-numeric, non-finite (Infinity/NaN survive `Number()`
 * on some inputs), and out-of-range values rather than accepting whatever
 * a caller sent. Shared by both query-string routes (parseCoords below)
 * and JSON-body routes (e.g. push subscribe) that need the same checks
 * against already-parsed values.
 */
export function coordsFromValues(lat: unknown, lon: unknown): Coords | null {
  const latNum = typeof lat === "number" ? lat : Number(lat);
  const lonNum = typeof lon === "number" ? lon : Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null;
  if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) return null;
  return { lat: latNum, lon: lonNum };
}

/**
 * Parses and validates lat/lon query params before they get interpolated
 * into an upstream API URL.
 */
export function parseCoords(searchParams: URLSearchParams): Coords | null {
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");
  if (!latRaw || !lonRaw) return null;
  return coordsFromValues(latRaw, lonRaw);
}
