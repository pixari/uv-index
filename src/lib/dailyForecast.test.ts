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
