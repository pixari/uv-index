import { describe, expect, it } from "vitest";
import { UV_REFLECTANCE, UV_INCREASE_PERCENT_PER_1000M } from "./uvPhysics";

describe("UV_REFLECTANCE", () => {
  it("every percentage is a plausible reflectance value", () => {
    for (const s of UV_REFLECTANCE) {
      expect(s.percent).toBeGreaterThan(0);
      expect(s.percent).toBeLessThanOrEqual(100);
    }
  });

  it("fresh snow reflects more than dry sand — sanity check against a swapped value", () => {
    const snow = UV_REFLECTANCE.find((s) => s.key === "freshSnow")!;
    const sand = UV_REFLECTANCE.find((s) => s.key === "drySand")!;
    expect(snow.percent).toBeGreaterThan(sand.percent);
  });

  it("has no duplicate surface keys", () => {
    const keys = UV_REFLECTANCE.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("UV_INCREASE_PERCENT_PER_1000M", () => {
  it("is a plausible small percentage, not a typo'd order of magnitude", () => {
    expect(UV_INCREASE_PERCENT_PER_1000M).toBeGreaterThan(0);
    expect(UV_INCREASE_PERCENT_PER_1000M).toBeLessThan(50);
  });
});
