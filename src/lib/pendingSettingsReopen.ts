// Switching language navigates to a different `/[locale]/...` URL, which
// remounts the whole page — including any open sheet. Settings uses this
// to say "reopen me after that navigation completes" so picking a language
// doesn't read as the panel randomly closing.
const KEY = "uv-index:reopen-settings";

export function markSettingsForReopen() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, "1");
}

/** Returns true (once) if Settings should reopen after the last navigation. */
export function consumeSettingsReopen(): boolean {
  if (typeof window === "undefined") return false;
  if (!sessionStorage.getItem(KEY)) return false;
  sessionStorage.removeItem(KEY);
  return true;
}
