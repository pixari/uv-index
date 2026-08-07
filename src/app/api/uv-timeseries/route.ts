import { NextRequest, NextResponse } from "next/server";
import { parseCoords } from "@/lib/validateCoords";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Same MET Norway source as /api/uv, but returns today's full hourly
// curve for the day-chart on the Learn page instead of just the
// current instant.
const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";

export async function GET(req: NextRequest) {
  const limited = rateLimit(`uv-timeseries:${clientIp(req.headers)}`, 20, 60_000);
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

  // Optional window size: the 24h day-chart wants hourly resolution,
  // the multi-day forecast wants further out. MET gives hourly steps
  // for ~2.5 days then falls back to 6-hourly, which is still enough
  // to estimate a daily peak.
  const hoursParam = Number(req.nextUrl.searchParams.get("hours"));
  const hours = Number.isFinite(hoursParam)
    ? Math.min(Math.max(Math.round(hoursParam), 1), 120)
    : 24;

  const res = await fetch(`${MET_URL}?lat=${lat}&lon=${lon}`, {
    headers: {
      "User-Agent": "uv-index-app (contact: raffaele.pizzari@gmail.com)",
    },
    next: { revalidate: 1800 },
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
    data: { instant: { details: { ultraviolet_index_clear_sky?: number } } };
  }> = data?.properties?.timeseries ?? [];

  // MET's forecast timeseries only looks forward from "now" — it never
  // includes hours already elapsed today. Filtering to the calendar day
  // would return an empty/flat curve for anyone checking in the evening
  // (only leftover nighttime hours, all UV 0). Taking the next 24 hourly
  // entries instead always shows a real curve, including tomorrow's rise.
  const today = timeseries
    .slice(0, hours)
    .map((e) => ({
      time: e.time,
      uv: e.data?.instant?.details?.ultraviolet_index_clear_sky ?? null,
    }))
    .filter((e) => e.uv !== null);

  return NextResponse.json({ today });
}
