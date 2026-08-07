// Web Badging API — shows a count on the installed PWA's icon, even while
// the app is closed. Not in every TS DOM lib yet, so the Navigator members
// are declared as optional ambient extensions below rather than cast with
// `any` at every call site. Support is Chromium-only as of writing; other
// browsers simply don't have the methods, which the `?.` calls below treat
// as a no-op rather than an error.

declare global {
  interface Navigator {
    setAppBadge?(contents?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}

export function appBadgeSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.setAppBadge === "function";
}

/** Best-effort — swallows rejections (e.g. not running as an installed PWA). */
export function setAppBadgeCount(count: number) {
  if (!appBadgeSupported()) return;
  const promise = count > 0 ? navigator.setAppBadge!(count) : navigator.clearAppBadge?.();
  promise?.catch(() => {});
}
