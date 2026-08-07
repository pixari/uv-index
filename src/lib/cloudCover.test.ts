import { describe, expect, it } from "vitest";
import { cloudCoverLevel } from "./cloudCover";

describe("cloudCoverLevel", () => {
  it("buckets known values", () => {
    expect(cloudCoverLevel(0)).toBe("clear");
    expect(cloudCoverLevel(19)).toBe("clear");
    expect(cloudCoverLevel(20)).toBe("partlyCloudy");
    expect(cloudCoverLevel(49)).toBe("partlyCloudy");
    expect(cloudCoverLevel(50)).toBe("mostlyCloudy");
    expect(cloudCoverLevel(79)).toBe("mostlyCloudy");
    expect(cloudCoverLevel(80)).toBe("cloudy");
    expect(cloudCoverLevel(100)).toBe("cloudy");
  });
});
