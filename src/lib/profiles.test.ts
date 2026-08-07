import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PROFILE_ID,
  addProfile,
  getActiveProfileId,
  getProfiles,
  removeProfile,
  resolveActiveProfileId,
  setActiveProfileId,
  setProfileSkinType,
} from "./profiles";

beforeEach(() => {
  localStorage.clear();
});

describe("getProfiles", () => {
  it("creates a single default profile on first run", () => {
    const profiles = getProfiles("Me");
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toEqual({ id: DEFAULT_PROFILE_ID, name: "Me", skinType: null });
  });

  it("migrates a legacy pre-profiles skin type into the default profile", () => {
    localStorage.setItem("uv-index:skin-type", "4");
    const profiles = getProfiles("Me");
    expect(profiles[0].skinType).toBe(4);
  });

  it("is stable across calls once created", () => {
    const first = getProfiles("Me");
    addProfile("Kid");
    const second = getProfiles("Me");
    expect(second).toHaveLength(first.length + 1);
  });
});

describe("removeProfile", () => {
  it("drops the profile and reassigns the active id if it was active", () => {
    getProfiles("Me");
    const kid = addProfile("Kid");
    setActiveProfileId(kid.id);

    const remaining = removeProfile(kid.id);

    expect(remaining.find((p) => p.id === kid.id)).toBeUndefined();
    expect(getActiveProfileId()).not.toBe(kid.id);
  });

  it("leaves the active id alone when removing a different profile", () => {
    getProfiles("Me");
    const kid = addProfile("Kid");
    setActiveProfileId(DEFAULT_PROFILE_ID);

    removeProfile(kid.id);

    expect(getActiveProfileId()).toBe(DEFAULT_PROFILE_ID);
  });
});

describe("resolveActiveProfileId", () => {
  it("falls back to the first profile when nothing is stored", () => {
    const profiles = getProfiles("Me");
    expect(resolveActiveProfileId("Me")).toBe(profiles[0].id);
  });

  it("falls back when the stored id no longer exists (e.g. was deleted)", () => {
    getProfiles("Me");
    setActiveProfileId("some-deleted-id");
    expect(resolveActiveProfileId("Me")).toBe(DEFAULT_PROFILE_ID);
  });

  it("honors a stored id that's still valid", () => {
    getProfiles("Me");
    const kid = addProfile("Kid");
    setActiveProfileId(kid.id);
    expect(resolveActiveProfileId("Me")).toBe(kid.id);
  });
});

describe("setProfileSkinType", () => {
  it("updates only the targeted profile", () => {
    getProfiles("Me");
    const kid = addProfile("Kid");
    setProfileSkinType(kid.id, 2);
    const profiles = getProfiles("Me");
    expect(profiles.find((p) => p.id === kid.id)?.skinType).toBe(2);
    expect(profiles.find((p) => p.id === DEFAULT_PROFILE_ID)?.skinType).toBeNull();
  });
});
