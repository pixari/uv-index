import { NextRequest, NextResponse } from "next/server";
import { REFERENCE_CITIES } from "@/lib/referenceCities";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { fetchCurrentUv } from "@/lib/metForecast";

// Same MET Norway source as /api/uv, fetched for a small fixed set of
// reference cities (see referenceCities.ts) instead of the caller's own
// coordinates — powers the "your UV vs. the world" comparison on /learn.

export async function GET(req: NextRequest) {
  const limited = rateLimit(`uv-reference:${clientIp(req.headers)}`, 15, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { cities: [] },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const cities = await Promise.all(
    REFERENCE_CITIES.map(async (c) => ({
      key: c.key,
      uv: await fetchCurrentUv(c.lat, c.lon),
    })),
  );

  return NextResponse.json({ cities });
}
