import { NextRequest, NextResponse } from "next/server";
import { coordsFromValues } from "@/lib/validateCoords";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getVapidConfig } from "@/lib/vapid";
import { isPushDbAvailable, upsertPushSubscription } from "@/lib/pushDb";
import { parseJsonBody, parseLocale, parseSubscriptionInput } from "@/lib/pushValidation";

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

  const body = await parseJsonBody(req);
  if (body === undefined) {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const subscription = parseSubscriptionInput(body);
  if (!subscription) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  const b = body as { lat?: unknown; lon?: unknown; placeLabel?: unknown; locale?: unknown };
  const coords = coordsFromValues(b.lat, b.lon);
  if (!coords) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const locale = parseLocale(b.locale);
  const placeLabel = typeof b.placeLabel === "string" ? b.placeLabel.slice(0, 200) : null;

  await upsertPushSubscription({
    ...subscription,
    lat: coords.lat,
    lon: coords.lon,
    placeLabel,
    locale,
  });

  return NextResponse.json({ ok: true });
}
