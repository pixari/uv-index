// Sunscreen reapplication guidance: every 2 hours, regardless of skin type
// or SPF strength — this is the standard dermatological interval (AAD),
// not something that scales with Fitzpatrick type. Skin type instead
// drives the separate "burn time without any protection" estimate in
// skinType.ts, a different question.
export const REAPPLY_INTERVAL_MINUTES = 120;

// Common retail SPF ratings. Stored alongside the timer purely so the
// person can record and see what they're using — it does not change
// REAPPLY_INTERVAL_MINUTES above (see note there).
export const SPF_OPTIONS = [15, 30, 50, 50 + 1] as const; // 51 stands in for "50+"
export type Spf = (typeof SPF_OPTIONS)[number];

const TIMER_KEY = "uv-index:reapply-started-at";
const SPF_KEY = "uv-index:reapply-spf";

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

export function getStoredSpf(): Spf | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SPF_KEY);
  const n = raw ? Number(raw) : null;
  return n && (SPF_OPTIONS as readonly number[]).includes(n) ? (n as Spf) : null;
}

export function setStoredSpf(spf: Spf) {
  localStorage.setItem(SPF_KEY, String(spf));
}

/** Minutes remaining until reapplication is due. Negative once overdue. */
export function minutesRemaining(startedAt: number): number {
  const elapsedMinutes = (Date.now() - startedAt) / 60000;
  return Math.ceil(REAPPLY_INTERVAL_MINUTES - elapsedMinutes);
}
