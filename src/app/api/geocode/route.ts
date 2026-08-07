import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Open-Meteo geocoding — free, no API key.
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function GET(req: NextRequest) {
  const limited = rateLimit(`geocode:${clientIp(req.headers)}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { results: [] },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const q = req.nextUrl.searchParams.get("q");
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = routing.locales.includes(langParam as (typeof routing.locales)[number])
    ? langParam
    : routing.defaultLocale;

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const res = await fetch(
    `${GEOCODE_URL}?name=${encodeURIComponent(q)}&count=5&language=${lang}`,
  );

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 502 });
  }

  const data = await res.json();
  const results = (data?.results ?? []).map(
    (r: {
      id: number;
      name: string;
      country: string;
      admin1?: string;
      latitude: number;
      longitude: number;
    }) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin1: r.admin1 ?? null,
      lat: r.latitude,
      lon: r.longitude,
    }),
  );

  return NextResponse.json({ results });
}
