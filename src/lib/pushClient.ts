// Browser-side half of Web Push: registers the service worker (public/sw.js),
// subscribes/unsubscribes with the push service, and tells our own API
// about it. Kept separate from notifications.ts (the foreground
// Notification-API helpers) since this is a materially different
// capability with its own failure modes — a deployment that hasn't set
// VAPID_PUBLIC_KEY, or a browser without Push API support (most desktop
// Safari, for one), should fall back to foreground-only alerts rather
// than break the toggle entirely.

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

/** Registers the SW (if needed), subscribes to push, and tells our API. Resolves false on any failure. */
export async function subscribeToHighUvPush(
  place: { lat: number; lon: number; label: string },
  locale: string,
): Promise<boolean> {
  if (!pushSupported()) return false;
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

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
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

/** Best-effort: unsubscribes locally and tells the server, but never throws. */
export async function unsubscribeFromHighUvPush(): Promise<void> {
  try {
    if (pushSupported()) {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
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
