import { NextRequest, NextResponse } from "next/server";

// Same MET Norway source as /api/uv, but returns today's full hourly
// curve for the day-chart on the Learn page instead of just the
// current instant.
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

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const today = timeseries
    .filter((e) => {
      const t = new Date(e.time).getTime();
      return t >= startOfDay.getTime() && t < endOfDay.getTime();
    })
    .map((e) => ({
      time: e.time,
      uv: e.data?.instant?.details?.ultraviolet_index_clear_sky ?? null,
    }))
    .filter((e) => e.uv !== null);

  return NextResponse.json({ today });
}
