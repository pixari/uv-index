// The device's most recently used place (GPS fix or searched city) —
// shared by every screen that needs "wherever the person last looked
// at": Home (restore on load, and keep in sync as it changes), /learn
// (chart that place's forecast), and Settings (point a new push
// subscription at it). Previously each of those three redeclared the
// same key and the same shape independently.

export type LastPlace = { lat: number; lon: number; label: string };

const LAST_PLACE_KEY = "uv-index:last-place";

export function getLastPlace(): LastPlace | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LAST_PLACE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LastPlace;
  } catch {
    return null;
  }
}

export function setLastPlace(place: LastPlace): void {
  localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(place));
}
