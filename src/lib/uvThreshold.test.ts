import { describe, expect, it } from "vitest";
import { HIGH_UV_THRESHOLD, crossedHighUvThreshold } from "./uvThreshold";

describe("crossedHighUvThreshold", () => {
  it("fires on the first reading if it's already at or above the threshold", () => {
    expect(crossedHighUvThreshold(null, HIGH_UV_THRESHOLD)).toBe(true);
    expect(crossedHighUvThreshold(null, HIGH_UV_THRESHOLD + 3)).toBe(true);
  });

  it("does not fire on the first reading if it's below the threshold", () => {
    expect(crossedHighUvThreshold(null, HIGH_UV_THRESHOLD - 1)).toBe(false);
  });

  it("fires exactly once on the rising edge, not on every reading while still high", () => {
    expect(crossedHighUvThreshold(HIGH_UV_THRESHOLD - 1, HIGH_UV_THRESHOLD)).toBe(true);
    // Already at/above threshold last time — no repeat fire.
    expect(crossedHighUvThreshold(HIGH_UV_THRESHOLD, HIGH_UV_THRESHOLD + 1)).toBe(false);
    expect(crossedHighUvThreshold(HIGH_UV_THRESHOLD + 1, HIGH_UV_THRESHOLD + 1)).toBe(false);
  });

  it("fires again after dropping back below and rising a second time", () => {
    expect(crossedHighUvThreshold(HIGH_UV_THRESHOLD, HIGH_UV_THRESHOLD - 1)).toBe(false);
    expect(crossedHighUvThreshold(HIGH_UV_THRESHOLD - 1, HIGH_UV_THRESHOLD)).toBe(true);
  });

  it("respects a custom threshold", () => {
    expect(crossedHighUvThreshold(2, 3, 3)).toBe(true);
    expect(crossedHighUvThreshold(3, 4, 3)).toBe(false);
  });
});
