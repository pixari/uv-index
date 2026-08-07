import { describe, expect, it } from "vitest";
import { IARC_TIMELINE } from "./iarcTimeline";

describe("IARC_TIMELINE", () => {
  it("is sorted ascending by year", () => {
    const years = IARC_TIMELINE.map((m) => m.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it("every milestone has a real-looking https source URL", () => {
    for (const m of IARC_TIMELINE) {
      expect(m.url).toMatch(/^https:\/\//);
    }
  });

  it("every year is plausible (IARC's modern monograph era, not in the future)", () => {
    for (const m of IARC_TIMELINE) {
      expect(m.year).toBeGreaterThan(1950);
      expect(m.year).toBeLessThanOrEqual(new Date().getFullYear());
    }
  });
});
