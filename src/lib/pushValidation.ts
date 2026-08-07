// Shared request-body parsing for the push API routes — subscribe,
// schedule-reminder, and cancel-reminder all receive the same
// PushSubscriptionJSON shape from the browser and need to validate it
// identically, so this is one place rather than three copies quietly
// drifting on what counts as valid.

import { routing } from "@/i18n/routing";

export function parseSubscriptionInput(
  body: unknown,
): { endpoint: string; p256dh: string; auth: string } | null {
  const b = body as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  const endpoint = b.subscription?.endpoint;
  const p256dh = b.subscription?.keys?.p256dh;
  const auth = b.subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return null;
  // Push endpoints are URLs handed out by the browser's own push service
  // (fcm.googleapis.com, updates.push.services.mozilla.com, …) — reject
  // anything that isn't actually a URL rather than trusting it verbatim.
  try {
    new URL(endpoint);
  } catch {
    return null;
  }
  return { endpoint, p256dh, auth };
}

export function parseLocale(value: unknown): string {
  return routing.locales.includes(value as (typeof routing.locales)[number])
    ? (value as string)
    : routing.defaultLocale;
}
