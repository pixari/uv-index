import { describe, expect, it } from "vitest";
import { groupDailyPeaks } from "./dailyForecast";

function point(iso: string, uv: number) {
  return { time: iso, uv };
}

describe("groupDailyPeaks", () => {
  it("takes the max UV per local calendar day", () => {
    const points = [
      point("2026-08-07T08:00:00Z", 2),
      point("2026-08-07T12:00:00Z", 7),
      point("2026-08-07T18:00:00Z", 1),
      point("2026-08-08T08:00:00Z", 3),
      point("2026-08-08T12:00:00Z", 5),
      point("2026-08-08T18:00:00Z", 1),
    ];
    const days = groupDailyPeaks(points);
    expect(days).toHaveLength(2);
    expect(days[0].uv).toBe(7);
    expect(days[1].uv).toBe(5);
  });

  it("regression: drops a trailing day built from too few (night-only) samples instead of reporting a misleading 0", () => {
    const points = [
      // Two full days of hourly coverage.
      ...Array.from({ length: 24 }, (_, h) =>
        point(`2026-08-07T${String(h).padStart(2, "0")}:00:00Z`, h >= 6 && h <= 18 ? 6 : 0),
      ),
      ...Array.from({ length: 24 }, (_, h) =>
        point(`2026-08-08T${String(h).padStart(2, "0")}:00:00Z`, h >= 6 && h <= 18 ? 5 : 0),
      ),
      // The window runs out mid-way through day 3 — only a single
      // just-after-midnight sample makes it in, so its "peak" is 0 even
      // though the real day hasn't happened yet.
      point("2026-08-09T00:00:00Z", 0),
    ];
    const days = groupDailyPeaks(points, 5);
    expect(days).toHaveLength(2);
    expect(days.every((d) => d.uv > 0)).toBe(true);
  });

  it("regression: drops a day whose samples are all dawn/dusk/night, even with 3+ of them, instead of reporting an implausibly low peak", () => {
    const points = [
      // Day 1: full hourly coverage, real midday peak of 9.
      ...Array.from({ length: 24 }, (_, h) =>
        point(`2026-08-07T${String(h).padStart(2, "0")}:00:00Z`, h >= 6 && h <= 18 ? 9 : 0),
      ),
      // Day 2: 4 synoptic samples, but none of them land near midday —
      // its highest recorded value (3) is really just a dawn/dusk reading,
      // not the day's true peak (which in August would also be ~9).
      point("2026-08-08T00:00:00Z", 0),
      point("2026-08-08T06:00:00Z", 3),
      point("2026-08-08T18:00:00Z", 2),
      point("2026-08-08T21:00:00Z", 0),
      // Day 3: 4 synoptic samples that do include a midday one — kept.
      point("2026-08-09T00:00:00Z", 0),
      point("2026-08-09T06:00:00Z", 3),
      point("2026-08-09T12:00:00Z", 8),
      point("2026-08-09T18:00:00Z", 2),
    ];
    const days = groupDailyPeaks(points, 5);
    expect(days.map((d) => d.uv)).toEqual([9, 8]);
  });

  it("keeps a sparse first day (today) even with few samples — it's expected to be partial", () => {
    const points = [point("2026-08-07T20:00:00Z", 1)];
    const days = groupDailyPeaks(points, 5);
    expect(days).toHaveLength(1);
    expect(days[0].uv).toBe(1);
  });

  it("caps the result at maxDays", () => {
    const points = Array.from({ length: 10 }, (_, i) =>
      point(`2026-08-${String(7 + i).padStart(2, "0")}T12:00:00Z`, 3, ),
    ).flatMap((p) => [p, p, p]); // 3 samples/day so none get dropped as sparse
    const days = groupDailyPeaks(points, 5);
    expect(days).toHaveLength(5);
  });
});
