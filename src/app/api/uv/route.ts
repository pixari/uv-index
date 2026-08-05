import { NextRequest, NextResponse } from "next/server";

// MET Norway Locationforecast — free, no API key, requires a descriptive
// User-Agent per their terms of use.
const MET_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

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
  const uv =
    data?.properties?.timeseries?.[0]?.data?.instant?.details
      ?.ultraviolet_index_clear_sky ?? null;
  const updatedAt = data?.properties?.meta?.updated_at ?? null;

  return NextResponse.json({ uv, updatedAt });
}
