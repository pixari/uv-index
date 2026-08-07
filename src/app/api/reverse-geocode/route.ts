import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { parseCoords } from "@/lib/validateCoords";

// BigDataCloud reverse geocoding — free, no API key, made for client-side use.
const REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export async function GET(req: NextRequest) {
  const coords = parseCoords(req.nextUrl.searchParams);
  if (!coords) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }
  const { lat, lon } = coords;

  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = routing.locales.includes(langParam as (typeof routing.locales)[number])
    ? langParam
    : routing.defaultLocale;

  const res = await fetch(
    `${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`,
  );

  if (!res.ok) {
    return NextResponse.json({ name: null }, { status: 502 });
  }

  const data = await res.json();
  const name = data?.city || data?.locality || data?.principalSubdivision || null;

  return NextResponse.json({ name });
}
