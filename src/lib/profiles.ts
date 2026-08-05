import type { SkinType } from "./skinType";

export type Profile = {
  id: string;
  name: string;
  skinType: SkinType | null;
};

export const DEFAULT_PROFILE_ID = "default";

const PROFILES_KEY = "uv-index:profiles";
const ACTIVE_PROFILE_KEY = "uv-index:active-profile-id";
const LEGACY_SKIN_TYPE_KEY = "uv-index:skin-type";

function readProfiles(): Profile[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILES_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Profile[];
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeProfiles(profiles: Profile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

/**
 * Returns the stored profile list, creating a default one the first time
 * this runs — migrating the pre-profiles single skin-type value (if any)
 * so upgrading users keep their setting instead of losing it.
 */
export function getProfiles(defaultName: string): Profile[] {
  const existing = readProfiles();
  if (existing) return existing;

  const legacyRaw =
    typeof window !== "undefined"
      ? localStorage.getItem(LEGACY_SKIN_TYPE_KEY)
      : null;
  const legacyType = legacyRaw ? Number(legacyRaw) : null;
  const skinType: SkinType | null =
    legacyType && legacyType >= 1 && legacyType <= 6
      ? (legacyType as SkinType)
      : null;

  const defaultProfile: Profile = {
    id: DEFAULT_PROFILE_ID,
    name: defaultName,
    skinType,
  };
  writeProfiles([defaultProfile]);
  return [defaultProfile];
}

export function addProfile(name: string): Profile {
  const profiles = readProfiles() ?? [];
  const profile: Profile = {
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `p_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name,
    skinType: null,
  };
  writeProfiles([...profiles, profile]);
  return profile;
}

export function removeProfile(id: string): Profile[] {
  const remaining = (readProfiles() ?? []).filter((p) => p.id !== id);
  writeProfiles(remaining);
  if (getActiveProfileId() === id && remaining.length > 0) {
    setActiveProfileId(remaining[0].id);
  }
  return remaining;
}

export function renameProfile(id: string, name: string) {
  writeProfiles((readProfiles() ?? []).map((p) => (p.id === id ? { ...p, name } : p)));
}

export function setProfileSkinType(id: string, skinType: SkinType) {
  writeProfiles(
    (readProfiles() ?? []).map((p) => (p.id === id ? { ...p, skinType } : p)),
  );
}

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

/** Resolves the active profile id, falling back to the first available one. */
export function resolveActiveProfileId(defaultName: string): string {
  const profiles = getProfiles(defaultName);
  const stored = getActiveProfileId();
  if (stored && profiles.some((p) => p.id === stored)) return stored;
  return profiles[0].id;
}
