import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  REAPPLY_INTERVAL_MINUTES,
  clearReapplyTimer,
  clearStoredSpf,
  getReapplyStartedAt,
  getStoredSpf,
  minutesRemaining,
  setStoredSpf,
  startReapplyTimer,
} from "./reapplyTimer";

const PROFILE = "p1";

beforeEach(() => {
  localStorage.clear();
});

describe("minutesRemaining", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down from the full interval right after starting", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    expect(minutesRemaining(now)).toBe(REAPPLY_INTERVAL_MINUTES);
  });

  it("goes negative once the interval has fully elapsed — overdue", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const startedAt = now - (REAPPLY_INTERVAL_MINUTES + 10) * 60_000;
    expect(minutesRemaining(startedAt)).toBeLessThan(0);
  });
});

describe("reapply timer storage", () => {
  it("round-trips start/read/clear per profile", () => {
    expect(getReapplyStartedAt(PROFILE)).toBeNull();
    startReapplyTimer(PROFILE);
    expect(getReapplyStartedAt(PROFILE)).not.toBeNull();
    clearReapplyTimer(PROFILE);
    expect(getReapplyStartedAt(PROFILE)).toBeNull();
  });

  it("scopes timers independently per profile", () => {
    startReapplyTimer("a");
    expect(getReapplyStartedAt("b")).toBeNull();
    expect(getReapplyStartedAt("a")).not.toBeNull();
  });
});

describe("SPF storage", () => {
  it("round-trips a valid SPF and rejects anything not in SPF_OPTIONS", () => {
    setStoredSpf(PROFILE, 30);
    expect(getStoredSpf(PROFILE)).toBe(30);

    localStorage.setItem("uv-index:reapply-spf:p1", "999");
    expect(getStoredSpf(PROFILE)).toBeNull();
  });

  it("clearStoredSpf removes the key — used when a profile is deleted", () => {
    setStoredSpf(PROFILE, 50);
    clearStoredSpf(PROFILE);
    expect(getStoredSpf(PROFILE)).toBeNull();
  });
});
