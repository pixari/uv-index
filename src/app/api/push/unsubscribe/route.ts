import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { deletePushSubscription, isPushDbAvailable } from "@/lib/pushDb";

export async function POST(req: NextRequest) {
  if (!(await isPushDbAvailable())) {
    // Nothing could have been stored in the first place — from the
    // caller's point of view that's the same outcome as a successful
    // unsubscribe, not an error.
    return NextResponse.json({ ok: true });
  }

  const limited = rateLimit(`push-unsubscribe:${clientIp(req.headers)}`, 10, 60_000);
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

  const endpoint = (body as { endpoint?: unknown }).endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  await deletePushSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
