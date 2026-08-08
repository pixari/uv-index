import { describe, expect, it } from "vitest";
import { aqiLevel } from "./airQuality";

describe("aqiLevel", () => {
  it("buckets known values", () => {
    expect(aqiLevel(0)).toBe("good");
    expect(aqiLevel(19)).toBe("good");
    expect(aqiLevel(20)).toBe("fair");
    expect(aqiLevel(39)).toBe("fair");
    expect(aqiLevel(40)).toBe("moderate");
    expect(aqiLevel(59)).toBe("moderate");
    expect(aqiLevel(60)).toBe("poor");
    expect(aqiLevel(79)).toBe("poor");
    expect(aqiLevel(80)).toBe("veryPoor");
    expect(aqiLevel(99)).toBe("veryPoor");
    expect(aqiLevel(100)).toBe("extremelyPoor");
    expect(aqiLevel(150)).toBe("extremelyPoor");
  });
});
