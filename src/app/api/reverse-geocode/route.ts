import { NextRequest, NextResponse } from "next/server";

// BigDataCloud reverse geocoding — free, no API key, made for client-side use.
const REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  const lang = req.nextUrl.searchParams.get("lang") ?? "en";

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

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
