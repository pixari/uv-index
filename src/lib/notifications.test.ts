import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureNotificationPermission,
  getHighUvNotifPref,
  getReapplyNotifPref,
  notificationsSupported,
  setHighUvNotifPref,
  setReapplyNotifPref,
  showNotification,
} from "./notifications";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("preferences", () => {
  it("default to off and round-trip through storage", () => {
    expect(getReapplyNotifPref()).toBe(false);
    setReapplyNotifPref(true);
    expect(getReapplyNotifPref()).toBe(true);

    expect(getHighUvNotifPref()).toBe(false);
    setHighUvNotifPref(true);
    expect(getHighUvNotifPref()).toBe(true);
  });
});

describe("notificationsSupported", () => {
  it("is false in an environment with no Notification API (jsdom, by default)", () => {
    expect(notificationsSupported()).toBe(false);
  });

  it("is true once the API is present", () => {
    vi.stubGlobal("Notification", function Notification() {});
    expect(notificationsSupported()).toBe(true);
  });
});

describe("ensureNotificationPermission", () => {
  it("resolves false when unsupported", async () => {
    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });

  it("resolves true without prompting when already granted", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    await expect(ensureNotificationPermission()).resolves.toBe(true);
  });

  it("resolves false without prompting when already denied", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });

  it("prompts when permission hasn't been decided yet", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(requestPermission).toHaveBeenCalled();
  });
});

describe("showNotification", () => {
  it("does nothing when unsupported", () => {
    expect(() => showNotification("title", "body")).not.toThrow();
  });

  it("does nothing when permission isn't granted", () => {
    const ctor = vi.fn();
    vi.stubGlobal("Notification", Object.assign(ctor, { permission: "default" }));
    showNotification("title", "body");
    expect(ctor).not.toHaveBeenCalled();
  });

  it("constructs a Notification when permission is granted", () => {
    const ctor = vi.fn();
    vi.stubGlobal("Notification", Object.assign(ctor, { permission: "granted" }));
    showNotification("title", "body");
    expect(ctor).toHaveBeenCalledWith("title", { body: "body" });
  });
});
