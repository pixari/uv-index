import { describe, expect, it } from "vitest";
import { REFERENCE_CITIES } from "./referenceCities";

describe("REFERENCE_CITIES", () => {
  it("every coordinate is within valid lat/lon range", () => {
    for (const c of REFERENCE_CITIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lon).toBeGreaterThanOrEqual(-180);
      expect(c.lon).toBeLessThanOrEqual(180);
    }
  });

  it("has no duplicate keys", () => {
    const keys = REFERENCE_CITIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has a spread of latitudes rather than clustering in one band", () => {
    const lats = REFERENCE_CITIES.map((c) => c.lat);
    expect(Math.max(...lats) - Math.min(...lats)).toBeGreaterThan(30);
  });
});
