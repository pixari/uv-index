// Shared MET Norway Locationforecast fetch + parse — previously copy-
// pasted across /api/uv, /api/uv-timeseries, and /api/uv-reference, each
// with its own MET_URL constant, headers, and timeseries shape. Now also
// used by the background push scheduler, which makes keeping this in one
// place a correctness requirement, not just tidiness: the scheduler and
// /api/uv need to agree on exactly what "the current UV reading" means.

const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";

type MetTimeseriesEntry = {
  time: string;
  data: {
    instant: {
      details: {
        ultraviolet_index_clear_sky?: number;
        air_temperature?: number;
        cloud_area_fraction?: number;
      };
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

// MET's timeseries is hourly (for the near term): timeseries[0] is the
// most recent entry *at or before* the moment MET generated the response,
// not "right now" — it can already be up to ~59 minutes old the instant
// it's fetched, and this response is itself cached for 30 minutes
// (fetchMetTimeseries's `revalidate`), so by the time someone actually
// sees it, "the first entry" can be up to ~90 minutes stale. Since UV
// rises fairly steadily toward solar noon and falls after it, that lag
// reads as a systematic *under*-estimate for anyone checking during the
// morning rise — not a rounding quirk, a real bias. Interpolating between
// the timeseries entries bracketing the actual current instant removes
// that bias regardless of cache age. `now` is a parameter (not always
// `Date.now()`) purely so tests can pin it.
function interpolateAtNow(
  timeseries: MetTimeseriesEntry[],
  extract: (details: MetTimeseriesEntry["data"]["instant"]["details"]) => number | undefined,
  now: number,
): number | null {
  let before: { time: number; value: number } | null = null;
  let after: { time: number; value: number } | null = null;

  for (const entry of timeseries) {
    const value = extract(entry.data?.instant?.details ?? {});
    if (value === undefined) continue;
    const time = new Date(entry.time).getTime();
    if (time <= now) {
      // Timeseries is chronological, so the last one satisfying this
      // keeps overwriting `before` until we reach the entry that's
      // actually closest to (at or just before) `now`.
      before = { time, value };
    } else if (!after) {
      after = { time, value };
      break; // sorted ascending — nothing past this can be closer
    }
  }

  if (before && after) {
    const span = after.time - before.time;
    if (span <= 0) return before.value;
    const fraction = (now - before.time) / span;
    return before.value + (after.value - before.value) * fraction;
  }
  // `now` falls outside the timeseries' range entirely (clock skew, or
  // right at the edge of the forecast window) — the nearest edge point
  // is still a far better answer than null.
  return before?.value ?? after?.value ?? null;
}

export function currentUvFrom(timeseries: MetTimeseriesEntry[], now: number = Date.now()): number | null {
  const value = interpolateAtNow(timeseries, (d) => d.ultraviolet_index_clear_sky, now);
  return value === null ? null : Math.round(value * 100) / 100;
}

/**
 * Same instant MET already gives us alongside the UV reading — no extra
 * request, just fields the app previously ignored. `cloudCover` is a raw
 * 0–100 percentage; see cloudCover.ts for turning that into a level.
 */
export function currentWeatherFrom(
  timeseries: MetTimeseriesEntry[],
  now: number = Date.now(),
): {
  temperature: number | null;
  cloudCover: number | null;
} {
  const temperature = interpolateAtNow(timeseries, (d) => d.air_temperature, now);
  const cloudCover = interpolateAtNow(timeseries, (d) => d.cloud_area_fraction, now);
  return {
    temperature: temperature === null ? null : Math.round(temperature * 10) / 10,
    cloudCover: cloudCover === null ? null : Math.round(cloudCover),
  };
}

/** Fetches just the current-instant UV reading for a point. */
export async function fetchCurrentUv(lat: number, lon: number): Promise<number | null> {
  const forecast = await fetchMetTimeseries(lat, lon);
  return forecast ? currentUvFrom(forecast.timeseries) : null;
}
