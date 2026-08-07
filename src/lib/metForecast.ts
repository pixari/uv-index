// Shared MET Norway Locationforecast fetch + parse — previously copy-
// pasted across /api/uv, /api/uv-timeseries, and /api/uv-reference, each
// with its own MET_URL constant, headers, and timeseries shape. Now also
// used by the background push scheduler, which makes keeping this in one
// place a correctness requirement, not just tidiness: the scheduler and
// /api/uv need to agree on exactly what "the current UV reading" means.

export const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";

export type MetTimeseriesEntry = {
  time: string;
  data: {
    instant: {
      details: { ultraviolet_index_clear_sky?: number };
    };
  };
};

/**
 * Fetches the full forecast timeseries for a point. Returns null (never
 * throws) on any upstream failure, so callers can treat "no data" as one
 * case instead of also catching network errors separately.
 */
export async function fetchMetTimeseries(
  lat: number,
  lon: number,
  opts?: { revalidate?: number },
): Promise<{ timeseries: MetTimeseriesEntry[]; updatedAt: string | null } | null> {
  try {
    const res = await fetch(`${MET_URL}?lat=${lat}&lon=${lon}`, {
      headers: {
        "User-Agent": "uv-index-app (contact: raffaele.pizzari@gmail.com)",
      },
      next: { revalidate: opts?.revalidate ?? 1800 }, // MET updates hourly-ish, cache 30min
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      timeseries: data?.properties?.timeseries ?? [],
      updatedAt: data?.properties?.meta?.updated_at ?? null,
    };
  } catch {
    return null;
  }
}

export function currentUvFrom(timeseries: MetTimeseriesEntry[]): number | null {
  return timeseries[0]?.data?.instant?.details?.ultraviolet_index_clear_sky ?? null;
}

/** Fetches just the current-instant UV reading for a point. */
export async function fetchCurrentUv(lat: number, lon: number): Promise<number | null> {
  const forecast = await fetchMetTimeseries(lat, lon);
  return forecast ? currentUvFrom(forecast.timeseries) : null;
}
