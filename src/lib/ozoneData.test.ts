import { describe, expect, it } from "vitest";
import { OZONE_HOLE_AREA, OZONE_RECOVERY_YEAR_ANTARCTIC } from "./ozoneData";

describe("OZONE_HOLE_AREA", () => {
  it("is sorted ascending by year with no duplicates", () => {
    const years = OZONE_HOLE_AREA.map((p) => p.year);
    const sorted = [...years].sort((a, b) => a - b);
    expect(years).toEqual(sorted);
    expect(new Set(years).size).toBe(years.length);
  });

  it("has plausible area values — sanity bound against a data-entry typo", () => {
    for (const p of OZONE_HOLE_AREA) {
      expect(p.areaMillionKm2).toBeGreaterThan(0);
      // Earth's total surface area is ~510 million km²; the ozone hole
      // has never been anywhere close to that.
      expect(p.areaMillionKm2).toBeLessThan(60);
    }
  });

  it("has at least a few points so the chart isn't degenerate", () => {
    expect(OZONE_HOLE_AREA.length).toBeGreaterThanOrEqual(3);
  });
});

describe("OZONE_RECOVERY_YEAR_ANTARCTIC", () => {
  it("is a plausible future year, after the most recent data point", () => {
    const lastDataYear = OZONE_HOLE_AREA[OZONE_HOLE_AREA.length - 1].year;
    expect(OZONE_RECOVERY_YEAR_ANTARCTIC).toBeGreaterThan(lastDataYear);
  });
});
