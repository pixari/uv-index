import { DEFAULT_PROFILE_ID } from "./profiles";

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

const TIMER_KEY_PREFIX = "uv-index:reapply-started-at";
const SPF_KEY_PREFIX = "uv-index:reapply-spf";
// Pre-profiles storage — migrated into the default profile's scoped keys.
const LEGACY_TIMER_KEY = "uv-index:reapply-started-at";
const LEGACY_SPF_KEY = "uv-index:reapply-spf";

function timerKey(profileId: string) {
  return `${TIMER_KEY_PREFIX}:${profileId}`;
}

function spfKey(profileId: string) {
  return `${SPF_KEY_PREFIX}:${profileId}`;
}

function migrateLegacy(profileId: string, legacyKey: string, scopedKey: string) {
  if (profileId !== DEFAULT_PROFILE_ID) return;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy && !localStorage.getItem(scopedKey)) {
    localStorage.setItem(scopedKey, legacy);
  }
  if (legacy) localStorage.removeItem(legacyKey);
}

export function getReapplyStartedAt(profileId: string): number | null {
  if (typeof window === "undefined") return null;
  migrateLegacy(profileId, LEGACY_TIMER_KEY, timerKey(profileId));
  const raw = localStorage.getItem(timerKey(profileId));
  return raw ? Number(raw) : null;
}

export function startReapplyTimer(profileId: string) {
  localStorage.setItem(timerKey(profileId), String(Date.now()));
}

export function clearReapplyTimer(profileId: string) {
  localStorage.removeItem(timerKey(profileId));
}

export function getStoredSpf(profileId: string): Spf | null {
  if (typeof window === "undefined") return null;
  migrateLegacy(profileId, LEGACY_SPF_KEY, spfKey(profileId));
  const raw = localStorage.getItem(spfKey(profileId));
  const n = raw ? Number(raw) : null;
  return n && (SPF_OPTIONS as readonly number[]).includes(n) ? (n as Spf) : null;
}

export function setStoredSpf(profileId: string, spf: Spf) {
  localStorage.setItem(spfKey(profileId), String(spf));
}

/** Minutes remaining until reapplication is due. Negative once overdue. */
export function minutesRemaining(startedAt: number): number {
  const elapsedMinutes = (Date.now() - startedAt) / 60000;
  return Math.ceil(REAPPLY_INTERVAL_MINUTES - elapsedMinutes);
}
