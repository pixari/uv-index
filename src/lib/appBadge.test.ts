import { afterEach, describe, expect, it, vi } from "vitest";
import { appBadgeSupported, setAppBadgeCount } from "./appBadge";

afterEach(() => {
  vi.unstubAllGlobals();
  // Assigning navigator.setAppBadge directly (rather than vi.stubGlobal)
  // patches the real jsdom navigator object, so it needs explicit cleanup
  // between tests.
  delete window.navigator.setAppBadge;
  delete window.navigator.clearAppBadge;
});

describe("appBadgeSupported", () => {
  it("is false when the Badging API doesn't exist (jsdom, by default)", () => {
    expect(appBadgeSupported()).toBe(false);
  });

  it("is true once navigator.setAppBadge is present", () => {
    navigator.setAppBadge = vi.fn().mockResolvedValue(undefined);
    expect(appBadgeSupported()).toBe(true);
  });
});

describe("setAppBadgeCount", () => {
  it("does nothing when unsupported", () => {
    expect(() => setAppBadgeCount(2)).not.toThrow();
  });

  it("calls setAppBadge with a positive count", () => {
    const setAppBadge = vi.fn().mockResolvedValue(undefined);
    navigator.setAppBadge = setAppBadge;
    setAppBadgeCount(3);
    expect(setAppBadge).toHaveBeenCalledWith(3);
  });

  it("calls clearAppBadge for a zero count instead of setAppBadge(0)", () => {
    const setAppBadge = vi.fn().mockResolvedValue(undefined);
    const clearAppBadge = vi.fn().mockResolvedValue(undefined);
    navigator.setAppBadge = setAppBadge;
    navigator.clearAppBadge = clearAppBadge;
    setAppBadgeCount(0);
    expect(clearAppBadge).toHaveBeenCalled();
    expect(setAppBadge).not.toHaveBeenCalled();
  });
});
