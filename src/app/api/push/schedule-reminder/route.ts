import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { getVapidConfig } from "@/lib/vapid";
import { isPushDbAvailable, upsertPushReminder } from "@/lib/pushDb";
import { parseJsonBody, parseLocale, parseSubscriptionInput } from "@/lib/pushValidation";

// One-shot reapply-sunscreen reminder — arms a background push for
// `dueAt`. Called right alongside startReapplyTimer() on the client, so
// the same "applied now" tap that starts the local countdown also arms
// its background-capable counterpart. Re-arming (same profile) replaces
// the previous due time — see pushDb.ts's upsertPushReminder.
export async function POST(req: NextRequest) {
  if (!getVapidConfig() || !(await isPushDbAvailable())) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }

  const limited = rateLimit(`push-schedule-reminder:${clientIp(req.headers)}`, 20, 60_000);
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

  const b = body as { profileId?: unknown; profileName?: unknown; locale?: unknown; dueAt?: unknown };
  const profileId = typeof b.profileId === "string" ? b.profileId.slice(0, 100) : null;
  const profileName = typeof b.profileName === "string" ? b.profileName.slice(0, 200) : "";
  const dueAt = typeof b.dueAt === "number" ? b.dueAt : NaN;
  if (!profileId || !Number.isFinite(dueAt)) {
    return NextResponse.json({ error: "profileId and dueAt required" }, { status: 400 });
  }
  // A reminder that's already due (or absurdly far out — a client bug,
  // not a real 2-hour reapply window) isn't worth scheduling.
  const MAX_DUE_MS = 24 * 3600 * 1000;
  if (dueAt <= Date.now() || dueAt > Date.now() + MAX_DUE_MS) {
    return NextResponse.json({ error: "dueAt out of range" }, { status: 400 });
  }

  await upsertPushReminder({
    ...subscription,
    profileId,
    profileName,
    locale: parseLocale(b.locale),
    dueAt,
  });

  return NextResponse.json({ ok: true });
}
