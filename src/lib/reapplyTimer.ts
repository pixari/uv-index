// Sunscreen reapplication guidance: every 2 hours, regardless of skin type
// or SPF strength — this is the standard dermatological interval (AAD),
// not something that scales with Fitzpatrick type. Skin type instead
// drives the separate "burn time without any protection" estimate in
// skinType.ts, a different question.
export const REAPPLY_INTERVAL_MINUTES = 120;

const TIMER_KEY = "uv-index:reapply-started-at";

export function getReapplyStartedAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TIMER_KEY);
  return raw ? Number(raw) : null;
}

export function startReapplyTimer() {
  localStorage.setItem(TIMER_KEY, String(Date.now()));
}

export function clearReapplyTimer() {
  localStorage.removeItem(TIMER_KEY);
}

/** Minutes remaining until reapplication is due. Negative once overdue. */
export function minutesRemaining(startedAt: number): number {
  const elapsedMinutes = (Date.now() - startedAt) / 60000;
  return Math.ceil(REAPPLY_INTERVAL_MINUTES - elapsedMinutes);
}
