// Browser-side half of Web Push: registers the service worker (public/sw.js),
// subscribes with the push service, and tells our own API about it. Kept
// separate from notifications.ts (the foreground Notification-API helpers)
// since this is a materially different capability with its own failure
// modes — a deployment that hasn't set VAPID_PUBLIC_KEY, or a browser
// without Push API support (most desktop Safari, for one), should fall
// back to foreground-only alerts rather than break either toggle entirely.
//
// Two independent features share one underlying browser subscription:
// the high-UV location watch (push_subscriptions) and the reapply
// reminder (push_reminders, one-shot). getOrCreatePushSubscription()
// is the one place either of them gets/creates it.

const PUSH_SUBSCRIBED_KEY = "uv-index:push-subscribed";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    // Set at build time from the same env var the server reads — see
    // .env.example. A deployment that never configured VAPID keys simply
    // doesn't offer this, same principle as pushDb.ts degrading quietly.
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

export function isPushSubscribedLocally(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PUSH_SUBSCRIBED_KEY) === "1";
}

// Web Push wants the VAPID public key as a raw byte array, not the
// base64url string it's normally handed around as.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes;
}

/** Registers the SW (if needed) and returns an existing or freshly-created subscription. Null on any failure. */
async function getOrCreatePushSubscription(): Promise<PushSubscriptionJSON | null> {
  if (!pushSupported()) return null;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Uint8Array's `buffer` typing widened to ArrayBufferLike (which
        // includes SharedArrayBuffer) in newer TS/DOM lib versions,
        // which the DOM PushManager types don't accept — the value
        // itself is a perfectly ordinary ArrayBuffer-backed view.
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }
    return subscription.toJSON();
  } catch {
    return null;
  }
}

/** Tells our API to watch a place for high UV and push when it crosses the threshold. */
export async function subscribeToHighUvPush(
  place: { lat: number; lon: number; label: string },
  locale: string,
): Promise<boolean> {
  const subscription = await getOrCreatePushSubscription();
  if (!subscription) return false;

  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription,
        lat: place.lat,
        lon: place.lon,
        placeLabel: place.label,
        locale,
      }),
    });
    if (!res.ok) return false;
    localStorage.setItem(PUSH_SUBSCRIBED_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort: tells the server to stop watching this device's place, but
 * never throws. Deliberately does *not* revoke the browser-level
 * PushSubscription itself — a reapply reminder (a separate toggle) might
 * still be relying on the same subscription, and re-subscribing
 * repeatedly is wasteful (and can fail) for no benefit over just leaving
 * an inert subscription registered.
 */
export async function unsubscribeFromHighUvPush(): Promise<void> {
  try {
    if (pushSupported()) {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});
      }
    }
  } catch {
    // Best-effort cleanup — the local flag below is what the UI actually
    // trusts, so a mid-unsubscribe failure doesn't leave the toggle stuck.
  } finally {
    localStorage.removeItem(PUSH_SUBSCRIBED_KEY);
  }
}

/** Arms a one-shot background reminder for `dueAt` (epoch ms). Resolves false on any failure. */
export async function scheduleReapplyPush(
  profileId: string,
  profileName: string,
  locale: string,
  dueAt: number,
): Promise<boolean> {
  const subscription = await getOrCreatePushSubscription();
  if (!subscription) return false;

  try {
    const res = await fetch("/api/push/schedule-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, profileId, profileName, locale, dueAt }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Best-effort: cancels a profile's pending reminder, but never throws. */
export async function cancelReapplyPush(profileId: string): Promise<void> {
  try {
    if (!pushSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await fetch("/api/push/cancel-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint, profileId }),
    }).catch(() => {});
  } catch {
    // best-effort
  }
}
