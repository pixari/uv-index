import { describe, expect, it } from "vitest";
import { BASE_BURN_MINUTES, burnMinutes } from "./skinType";

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
