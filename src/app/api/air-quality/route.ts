import { NextRequest, NextResponse } from "next/server";
import { parseCoords } from "@/lib/validateCoords";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { fetchCurrentAqi } from "@/lib/airQualityForecast";

// Dedicated air-quality endpoint — not currently called by Home (which gets
// `aqi` inline from /api/uv to keep it a single request), but kept around
// for future use (e.g. an hourly air trend in the forecast panel) and as
// the natural place to hit if only air quality is needed.
export async function GET(req: NextRequest) {
  const limited = rateLimit(`air-quality:${clientIp(req.headers)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { aqi: null },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const coords = parseCoords(req.nextUrl.searchParams);
  if (!coords) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const aqi = await fetchCurrentAqi(coords.lat, coords.lon);
  return NextResponse.json({ aqi });
}
