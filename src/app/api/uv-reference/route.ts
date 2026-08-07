import { NextRequest, NextResponse } from "next/server";
import { REFERENCE_CITIES } from "@/lib/referenceCities";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Same MET Norway source as /api/uv, fetched for a small fixed set of
// reference cities (see referenceCities.ts) instead of the caller's own
// coordinates — powers the "your UV vs. the world" comparison on /learn.
const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";

async function fetchUv(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(`${MET_URL}?lat=${lat}&lon=${lon}`, {
      headers: {
        "User-Agent": "uv-index-app (contact: raffaele.pizzari@gmail.com)",
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data?.properties?.timeseries?.[0];
    return current?.data?.instant?.details?.ultraviolet_index_clear_sky ?? null;
  } catch {
    return null;
  }
}

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
      uv: await fetchUv(c.lat, c.lon),
    })),
  );

  return NextResponse.json({ cities });
}
