import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { deletePushReminder, isPushDbAvailable } from "@/lib/pushDb";

export async function POST(req: NextRequest) {
  if (!(await isPushDbAvailable())) {
    // Nothing could have been scheduled in the first place — same
    // outcome from the caller's point of view as a successful cancel.
    return NextResponse.json({ ok: true });
  }

  const limited = rateLimit(`push-cancel-reminder:${clientIp(req.headers)}`, 20, 60_000);
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

  const b = body as { endpoint?: unknown; profileId?: unknown };
  if (typeof b.endpoint !== "string" || !b.endpoint || typeof b.profileId !== "string" || !b.profileId) {
    return NextResponse.json({ error: "endpoint and profileId required" }, { status: 400 });
  }

  await deletePushReminder(b.endpoint, b.profileId);
  return NextResponse.json({ ok: true });
}
