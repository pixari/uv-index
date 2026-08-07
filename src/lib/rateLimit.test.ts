import { describe, expect, it } from "vitest";
import { clientIp, rateLimit } from "./rateLimit";

describe("rateLimit", () => {
  it("allows requests under the limit within the window", () => {
    const key = `test-${Math.random()}`;
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000, now + i).ok).toBe(true);
    }
  });

  it("blocks once the limit is hit within the window", () => {
    const key = `test-${Math.random()}`;
    const now = 2_000_000;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000, now);
    const blocked = rateLimit(key, 3, 60_000, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets once the window has elapsed", () => {
    const key = `test-${Math.random()}`;
    const windowMs = 60_000;
    const start = 3_000_000;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, windowMs, start);
    expect(rateLimit(key, 3, windowMs, start).ok).toBe(false);
    expect(rateLimit(key, 3, windowMs, start + windowMs).ok).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const now = 4_000_000;
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    rateLimit(a, 1, 60_000, now);
    expect(rateLimit(a, 1, 60_000, now).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000, now).ok).toBe(true);
  });
});

describe("clientIp", () => {
  function headers(map: Record<string, string>) {
    return { get: (name: string) => map[name.toLowerCase()] ?? null };
  }

  it("prefers the first x-forwarded-for entry", () => {
    expect(clientIp(headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back to 'unknown' when neither header is present", () => {
    expect(clientIp(headers({}))).toBe("unknown");
  });
});
