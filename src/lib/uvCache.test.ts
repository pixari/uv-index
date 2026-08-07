import { beforeEach, describe, expect, it } from "vitest";
import { getCachedUv, setCachedUv } from "./uvCache";

beforeEach(() => {
  localStorage.clear();
});

describe("uvCache", () => {
  it("returns null when nothing has been cached yet", () => {
    expect(getCachedUv(40.6, 17.9)).toBeNull();
  });

  it("round-trips a reading for the same place", () => {
    setCachedUv({
      lat: 40.6,
      lon: 17.9,
      uv: 7,
      updatedAt: "2026-08-07T12:00:00Z",
      safeAfter: null,
      fetchedAt: Date.now(),
    });
    const cached = getCachedUv(40.6, 17.9);
    expect(cached?.uv).toBe(7);
  });

  it("tolerates tiny coordinate differences (~1km) as the same place", () => {
    setCachedUv({
      lat: 40.601,
      lon: 17.899,
      uv: 5,
      updatedAt: null,
      safeAfter: null,
      fetchedAt: Date.now(),
    });
    expect(getCachedUv(40.6, 17.9)?.uv).toBe(5);
  });

  it("returns null for a different place", () => {
    setCachedUv({
      lat: 40.6,
      lon: 17.9,
      uv: 7,
      updatedAt: null,
      safeAfter: null,
      fetchedAt: Date.now(),
    });
    expect(getCachedUv(51.5, -0.1)).toBeNull();
  });
});
