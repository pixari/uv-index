import { describe, expect, it } from "vitest";
import { VITAMIN_D_MINUTES_BY_TYPE, vitaminDMinutes } from "./vitaminD";

describe("vitaminDMinutes", () => {
  it("rounds the reference minutes for display", () => {
    expect(vitaminDMinutes(1)).toBe(Math.round(VITAMIN_D_MINUTES_BY_TYPE[1]));
    expect(vitaminDMinutes(6)).toBe(Math.round(VITAMIN_D_MINUTES_BY_TYPE[6]));
  });

  it("gives darker skin types a longer reference time than fairer ones", () => {
    expect(vitaminDMinutes(1)).toBeLessThan(vitaminDMinutes(6));
  });

  it("covers every skin type with a positive value", () => {
    for (const type of [1, 2, 3, 4, 5, 6] as const) {
      expect(vitaminDMinutes(type)).toBeGreaterThan(0);
    }
  });
});
