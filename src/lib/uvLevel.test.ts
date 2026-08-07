import { describe, expect, it } from "vitest";
import { skyGradientCss, uvLevel } from "./uvLevel";

describe("uvLevel", () => {
  it("classifies each WHO band, including the boundaries", () => {
    expect(uvLevel(0)).toBe("low");
    expect(uvLevel(2.9)).toBe("low");
    expect(uvLevel(3)).toBe("moderate");
    expect(uvLevel(5.9)).toBe("moderate");
    expect(uvLevel(6)).toBe("high");
    expect(uvLevel(7.9)).toBe("high");
    expect(uvLevel(8)).toBe("veryHigh");
    expect(uvLevel(10.9)).toBe("veryHigh");
    expect(uvLevel(11)).toBe("extreme");
    expect(uvLevel(15)).toBe("extreme");
  });
});

describe("skyGradientCss", () => {
  it("returns a linear-gradient string for a known level", () => {
    expect(skyGradientCss("low")).toMatch(/^linear-gradient\(180deg, .+ 0%, .+ 100%\)$/);
  });

  it("falls back to the neutral gradient when level is null", () => {
    expect(skyGradientCss(null)).toContain("oklch(0.4 0.02 240)");
  });
});
