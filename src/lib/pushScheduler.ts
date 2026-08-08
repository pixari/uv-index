// The two background jobs this app runs, both on the same 15-minute
// timer, started once per server process from src/instrumentation.ts:
//
// 1. High-UV alert — check each active subscription's location against
//    the threshold, push on the rising edge. Background counterpart to
//    HomeClient's foreground-only maybeNotifyHighUv.
// 2. Reapply reminder — send any one-shot reminder whose due time has
//    passed. Background counterpart to ReapplyTimer's foreground-only
//    overdue notification.

import webpush from "web-push";
import enMessages from "../../messages/en.json";
import itMessages from "../../messages/it.json";
import deMessages from "../../messages/de.json";
import { getVapidConfig } from "./vapid";
import {
  isPushDbAvailable,
  listPushSubscriptions,
  updateLastUv,
  deletePushSubscription,
  listPushReminders,
  deletePushReminderById,
  deletePushRemindersForEndpoint,
  type PushSubscriptionRecord,
} from "./pushDb";
import { fetchCurrentUv } from "./metForecast";
import { crossedHighUvThreshold } from "./uvThreshold";

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // matches HomeClient's own poll cadence

// A reminder is time-sensitive — if it's been sitting un-sendable (a
// transient push-service error, say) for this long, it's stopped being
// useful and retrying it forever would just be noise.
const REMINDER_GIVE_UP_MS = 2 * 3600 * 1000;

type NotifyStrings = {
  highUvTitle: string;
  highUvBody: string;
  reapplyTitle: string;
  reapplyBody: string;
};

const NOTIFY_MESSAGES: Record<string, NotifyStrings> = {
  en: enMessages.notify,
  it: itMessages.notify,
  de: deMessages.notify,
};

// Exported for direct unit testing — everything else in this file is
// either orchestration or has real network/DB side effects, but locale
// fallback, grid bucketing, and message formatting are worth pinning
// down precisely.

export function notificationFor(locale: string, uv: number) {
  const strings = NOTIFY_MESSAGES[locale] ?? NOTIFY_MESSAGES.en;
  return {
    title: strings.highUvTitle,
    body: strings.highUvBody.replace("{uv}", String(Math.round(uv))),
  };
}

export function reminderNotificationFor(locale: string, profileName: string) {
  const strings = NOTIFY_MESSAGES[locale] ?? NOTIFY_MESSAGES.en;
  return {
    title: strings.reapplyTitle,
    body: strings.reapplyBody.replace("{name}", profileName),
  };
}

// ~1.1km grid, same rationale as the client-side reading cache in
// uvCache.ts: cheap way to treat "basically the same point" as one fetch
// without requiring an exact float match.
export function gridKey(lat: number, lon: number): string {
  return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
}

let started = false;

type SendResult = "sent" | "gone" | "failed";

async function sendRawPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: { title: string; body: string },
): Promise<SendResult> {
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload),
    );
    return "sent";
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) return "gone";
    console.warn(`[push] send failed (status ${statusCode ?? "?"})`);
    return "failed";
  }
}

async function sendHighUvPush(sub: PushSubscriptionRecord, uv: number) {
  const result = await sendRawPush(sub.endpoint, sub.p256dh, sub.auth, notificationFor(sub.locale, uv));
  if (result === "gone") {
    // The push service itself says this endpoint is gone — the browser
    // unregistered, the person uninstalled, whatever the reason. Clears
    // any reminders tied to the same dead endpoint too, not just the
    // location watch.
    await deletePushSubscription(sub.endpoint);
    await deletePushRemindersForEndpoint(sub.endpoint);
  }
}

/** Exported for tests — production callers only need startPushScheduler. */
export async function runCheck() {
  const vapid = getVapidConfig();
  if (!vapid || !(await isPushDbAvailable())) return;

  const subs = await listPushSubscriptions();
  if (subs.length === 0) return;

  const byLocation = new Map<string, PushSubscriptionRecord[]>();
  for (const sub of subs) {
    const key = gridKey(sub.lat, sub.lon);
    const bucket = byLocation.get(key);
    if (bucket) bucket.push(sub);
    else byLocation.set(key, [sub]);
  }

  for (const bucket of byLocation.values()) {
    const uv = await fetchCurrentUv(bucket[0].lat, bucket[0].lon);
    if (uv === null) continue; // upstream hiccup — try again next tick, don't touch stored state

    for (const sub of bucket) {
      if (crossedHighUvThreshold(sub.lastUv, uv)) {
        await sendHighUvPush(sub, uv);
      }
      await updateLastUv(sub.endpoint, uv);
    }
  }
}

/** Exported for tests — production callers only need startPushScheduler. */
export async function checkDueReminders() {
  if (!(await isPushDbAvailable())) return;

  const reminders = await listPushReminders();
  const now = Date.now();

  for (const reminder of reminders) {
    if (reminder.dueAt > now) continue; // not due yet

    const result = await sendRawPush(
      reminder.endpoint,
      reminder.p256dh,
      reminder.auth,
      reminderNotificationFor(reminder.locale, reminder.profileName),
    );

    const giveUp = result !== "failed" || now - reminder.dueAt > REMINDER_GIVE_UP_MS;
    if (giveUp) await deletePushReminderById(reminder.id);
    if (result === "gone") await deletePushSubscription(reminder.endpoint);
  }
}

export async function startPushScheduler() {
  if (started) return;
  started = true;

  const vapid = getVapidConfig();
  if (!vapid) {
    console.info("[push] VAPID not configured — background push disabled.");
    return;
  }
  if (!(await isPushDbAvailable())) return; // pushDb.ts already logs why

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  async function tick() {
    await runCheck().catch((err) => console.warn("[push] high-UV tick failed", err));
    await checkDueReminders().catch((err) => console.warn("[push] reminder tick failed", err));
  }

  const timer = setInterval(() => {
    tick();
  }, CHECK_INTERVAL_MS);
  // Don't hold the process open just for this timer during graceful
  // shutdown/short-lived scripts (e.g. `next build`'s own instrumentation
  // pass) — a real server keeps running for other reasons regardless.
  timer.unref?.();

  // Also run once shortly after boot rather than waiting a full interval.
  tick();
}
