// Local, foreground notifications only — this app has no push server or
// service worker, so these fire from the Web Notifications API while the
// tab/PWA is open (including backgrounded, not fully closed). That's a real
// limitation, not an oversight: true background push needs a backend.

export const HIGH_UV_THRESHOLD = 7;

const REAPPLY_PREF_KEY = "uv-index:notif-reapply";
const HIGH_UV_PREF_KEY = "uv-index:notif-high-uv";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getReapplyNotifPref(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REAPPLY_PREF_KEY) === "1";
}

export function setReapplyNotifPref(on: boolean) {
  localStorage.setItem(REAPPLY_PREF_KEY, on ? "1" : "0");
}

export function getHighUvNotifPref(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HIGH_UV_PREF_KEY) === "1";
}

export function setHighUvNotifPref(on: boolean) {
  localStorage.setItem(HIGH_UV_PREF_KEY, on ? "1" : "0");
}

/** Prompts for permission if not yet decided. Resolves to whether a notification can actually be shown. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    // A handful of mobile browsers only allow the constructor form via a
    // service-worker registration and throw otherwise — skip rather than
    // crash the app over a best-effort notification.
  }
}
