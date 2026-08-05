export type SavedPlace = {
  id: string;
  label: string;
  lat: number;
  lon: number;
};

const PLACES_KEY = "uv-index:saved-places";

function placeId(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export function getSavedPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PLACES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedPlace[];
  } catch {
    return [];
  }
}

function setSavedPlaces(places: SavedPlace[]) {
  localStorage.setItem(PLACES_KEY, JSON.stringify(places));
}

/** Adds a place, or updates its label if the same coordinates already exist. */
export function savePlace(place: {
  label: string;
  lat: number;
  lon: number;
}): SavedPlace {
  const id = placeId(place.lat, place.lon);
  const places = getSavedPlaces();
  const entry: SavedPlace = { id, ...place };
  setSavedPlaces(
    places.some((p) => p.id === id)
      ? places.map((p) => (p.id === id ? entry : p))
      : [...places, entry],
  );
  return entry;
}

export function removeSavedPlace(id: string) {
  setSavedPlaces(getSavedPlaces().filter((p) => p.id !== id));
}

export function isSaved(lat: number, lon: number): boolean {
  const id = placeId(lat, lon);
  return getSavedPlaces().some((p) => p.id === id);
}

export function samePlaceId(lat: number, lon: number, id: string): boolean {
  return placeId(lat, lon) === id;
}
