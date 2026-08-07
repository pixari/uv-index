import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { coordsFromValues } from "@/lib/validateCoords";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getVapidConfig } from "@/lib/vapid";
import { isPushDbAvailable, upsertPushSubscription } from "@/lib/pushDb";

// Saves (or refreshes) a browser's push subscription plus the one place
// it wants alerted for. Re-subscribing with the same endpoint but a new
// place/locale just overwrites the row — see the ON CONFLICT clause in
// pushDb.ts — so switching location and re-enabling the toggle keeps a
// person to one active alert, not an ever-growing pile of stale ones.
export async function POST(req: NextRequest) {
  if (!getVapidConfig() || !(await isPushDbAvailable())) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }

  const limited = rateLimit(`push-subscribe:${clientIp(req.headers)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const b = body as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    lat?: unknown;
    lon?: unknown;
    placeLabel?: unknown;
    locale?: unknown;
  };

  const endpoint = b.subscription?.endpoint;
  const p256dh = b.subscription?.keys?.p256dh;
  const auth = b.subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }
  // Push endpoints are URLs handed out by the browser's own push service
  // (fcm.googleapis.com, updates.push.services.mozilla.com, …) — reject
  // anything that isn't actually a URL rather than trusting it verbatim.
  try {
    new URL(endpoint);
  } catch {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  const coords = coordsFromValues(b.lat, b.lon);
  if (!coords) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const locale = routing.locales.includes(
    b.locale as (typeof routing.locales)[number],
  )
    ? (b.locale as string)
    : routing.defaultLocale;
  const placeLabel = typeof b.placeLabel === "string" ? b.placeLabel.slice(0, 200) : null;

  await upsertPushSubscription({
    endpoint,
    p256dh,
    auth,
    lat: coords.lat,
    lon: coords.lon,
    placeLabel,
    locale,
  });

  return NextResponse.json({ ok: true });
}
