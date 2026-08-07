import { NextRequest, NextResponse } from "next/server";
import { uvLevel } from "@/lib/uvLevel";
import { parseCoords } from "@/lib/validateCoords";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// MET Norway Locationforecast — free, no API key, requires a descriptive
// User-Agent per their terms of use.
const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";

// Look no further than 24h ahead for a "safe after" estimate — beyond
// that the forecast is coarser and the number stops being actionable
// ("safe after" should answer "later today", not "sometime this week").
const FORECAST_WINDOW_HOURS = 24;

export async function GET(req: NextRequest) {
  const limited = rateLimit(`uv:${clientIp(req.headers)}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const coords = parseCoords(req.nextUrl.searchParams);
  if (!coords) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }
  const { lat, lon } = coords;

  const res = await fetch(`${MET_URL}?lat=${lat}&lon=${lon}`, {
    headers: {
      "User-Agent": "uv-index-app (contact: raffaele.pizzari@gmail.com)",
    },
    next: { revalidate: 1800 }, // MET updates hourly-ish, cache 30min
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "upstream fetch failed" },
      { status: 502 },
    );
  }

  const data = await res.json();
  const timeseries: Array<{
    time: string;
    data: {
      instant: {
        details: { ultraviolet_index_clear_sky?: number };
      };
    };
  }> = data?.properties?.timeseries ?? [];

  const current = timeseries[0];
  const uv = current?.data?.instant?.details?.ultraviolet_index_clear_sky ?? null;
  const updatedAt = data?.properties?.meta?.updated_at ?? null;

  // "Safe after" — the next time UV drops back into the "low" bracket
  // (no protection needed), searched within the next 24h. Null if
  // already safe now, or if it doesn't drop within the window.
  let safeAfter: string | null = null;
  if (uv !== null && uvLevel(uv) !== "low") {
    const cutoff = Date.now() + FORECAST_WINDOW_HOURS * 3600 * 1000;
    for (const entry of timeseries.slice(1)) {
      const entryTime = new Date(entry.time).getTime();
      if (entryTime > cutoff) break;
      const entryUv = entry.data?.instant?.details?.ultraviolet_index_clear_sky;
      if (typeof entryUv === "number" && uvLevel(entryUv) === "low") {
        safeAfter = entry.time;
        break;
      }
    }
  }

  return NextResponse.json({ uv, updatedAt, safeAfter });
}
