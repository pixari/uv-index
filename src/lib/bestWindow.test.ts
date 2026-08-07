import { describe, expect, it } from "vitest";
import { findLowRiskWindows } from "./bestWindow";

function point(iso: string, uv: number) {
  return { time: iso, uv };
}

describe("findLowRiskWindows", () => {
  it("merges contiguous low-risk hours into a single window", () => {
    const points = [
      point("2026-08-07T06:00:00Z", 1),
      point("2026-08-07T07:00:00Z", 2),
      point("2026-08-07T08:00:00Z", 2.9),
      point("2026-08-07T09:00:00Z", 5),
    ];
    const windows = findLowRiskWindows(points);
    expect(windows).toEqual([
      { start: "2026-08-07T06:00:00Z", end: "2026-08-07T08:00:00Z" },
    ]);
  });

  it("treats exactly 3 as not low (moderate starts at 3)", () => {
    const windows = findLowRiskWindows([point("2026-08-07T06:00:00Z", 3)]);
    expect(windows).toEqual([]);
  });

  it("splits into separate windows when a high stretch interrupts", () => {
    const points = [
      point("2026-08-07T06:00:00Z", 1),
      point("2026-08-07T12:00:00Z", 8),
      point("2026-08-07T20:00:00Z", 1),
    ];
    const windows = findLowRiskWindows(points);
    expect(windows).toHaveLength(2);
  });

  it("returns an empty list when nothing is ever low", () => {
    expect(findLowRiskWindows([point("2026-08-07T12:00:00Z", 9)])).toEqual([]);
  });

  it("closes a window still open at the end of the series", () => {
    const points = [point("2026-08-07T18:00:00Z", 1), point("2026-08-07T19:00:00Z", 1)];
    const windows = findLowRiskWindows(points);
    expect(windows).toEqual([
      { start: "2026-08-07T18:00:00Z", end: "2026-08-07T19:00:00Z" },
    ]);
  });
});
