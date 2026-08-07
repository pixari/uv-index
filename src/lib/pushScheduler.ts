// The one background job this app runs: periodically check each active
// push subscription's location against the high-UV threshold and send a
// real push notification on the rising edge — the background-capable
// counterpart to HomeClient's foreground-only maybeNotifyHighUv. Started
// once per server process from src/instrumentation.ts.

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
  type PushSubscriptionRecord,
} from "./pushDb";
import { fetchCurrentUv } from "./metForecast";
import { crossedHighUvThreshold } from "./uvThreshold";

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // matches HomeClient's own poll cadence

const NOTIFY_MESSAGES: Record<string, { highUvTitle: string; highUvBody: string }> = {
  en: enMessages.notify,
  it: itMessages.notify,
  de: deMessages.notify,
};

// Exported for direct unit testing — everything else in this file is
// either orchestration or has real network/DB side effects, but locale
// fallback and grid bucketing are worth pinning down precisely.

export function notificationFor(locale: string, uv: number) {
  const strings = NOTIFY_MESSAGES[locale] ?? NOTIFY_MESSAGES.en;
  return {
    title: strings.highUvTitle,
    body: strings.highUvBody.replace("{uv}", String(Math.round(uv))),
  };
}

// ~1.1km grid, same rationale as the client-side reading cache in
// uvCache.ts: cheap way to treat "basically the same point" as one fetch
// without requiring an exact float match.
export function gridKey(lat: number, lon: number): string {
  return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
}

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

async function sendPush(sub: PushSubscriptionRecord, uv: number, subject: string) {
  const { title, body } = notificationFor(sub.locale, uv);
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({ title, body }),
    );
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // The push service itself says this endpoint is gone — the
      // browser unregistered, the user uninstalled, whatever the
      // reason, retrying it forever would just be noise.
      await deletePushSubscription(sub.endpoint);
    } else {
      console.warn(`[push] send failed for one subscription (status ${statusCode ?? "?"})`, subject);
    }
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
        await sendPush(sub, uv, vapid.subject);
      }
      await updateLastUv(sub.endpoint, uv);
    }
  }
}

export async function startPushScheduler() {
  if (started) return;
  started = true;

  const vapid = getVapidConfig();
  if (!vapid) {
    console.info("[push] VAPID not configured — background high-UV push disabled.");
    return;
  }
  if (!(await isPushDbAvailable())) return; // pushDb.ts already logs why

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  timer = setInterval(() => {
    runCheck().catch((err) => console.warn("[push] scheduler tick failed", err));
  }, CHECK_INTERVAL_MS);
  // Don't hold the process open just for this timer during graceful
  // shutdown/short-lived scripts (e.g. `next build`'s own instrumentation
  // pass) — a real server keeps running for other reasons regardless.
  timer.unref?.();

  // Also run once shortly after boot rather than waiting a full interval.
  runCheck().catch((err) => console.warn("[push] initial scheduler tick failed", err));
}

export function stopPushScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
