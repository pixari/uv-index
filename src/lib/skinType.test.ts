import { describe, expect, it } from "vitest";
import { BASE_BURN_MINUTES, burnMinutes, burnUrgencyLevel } from "./skinType";

describe("burnMinutes", () => {
  it("returns null when UV is zero or negative — no burn risk to estimate", () => {
    expect(burnMinutes(3, 0)).toBeNull();
    expect(burnMinutes(3, -1)).toBeNull();
  });

  it("scales inversely with UV index for a given skin type", () => {
    expect(burnMinutes(1, 1)).toBe(BASE_BURN_MINUTES[1]);
    expect(burnMinutes(1, 2)).toBe(Math.round(BASE_BURN_MINUTES[1] / 2));
  });

  it("gives fairer skin types a shorter burn time at the same UV", () => {
    expect(burnMinutes(1, 5)!).toBeLessThan(burnMinutes(6, 5)!);
  });
});

describe("burnUrgencyLevel", () => {
  it("maps short burn times to the most urgent tiers", () => {
    expect(burnUrgencyLevel(5)).toBe("extreme");
    expect(burnUrgencyLevel(20)).toBe("veryHigh");
    expect(burnUrgencyLevel(45)).toBe("high");
    expect(burnUrgencyLevel(90)).toBe("moderate");
    expect(burnUrgencyLevel(300)).toBe("low");
  });

  it("is monotonic — a longer burn time never maps to a more urgent tier", () => {
    const samples = [5, 10, 14, 15, 29, 30, 59, 60, 119, 120, 500];
    const order = ["extreme", "veryHigh", "high", "moderate", "low"];
    let lastIndex = -1;
    for (const minutes of samples) {
      const idx = order.indexOf(burnUrgencyLevel(minutes));
      expect(idx).toBeGreaterThanOrEqual(lastIndex);
      lastIndex = idx;
    }
  });
});
