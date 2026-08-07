import { describe, expect, it } from "vitest";
import { parseCoords } from "./validateCoords";

function params(obj: Record<string, string>) {
  return new URLSearchParams(obj);
}

describe("parseCoords", () => {
  it("parses valid numeric coordinates", () => {
    expect(parseCoords(params({ lat: "40.6", lon: "17.9" }))).toEqual({
      lat: 40.6,
      lon: 17.9,
    });
  });

  it("rejects missing params", () => {
    expect(parseCoords(params({ lat: "40.6" }))).toBeNull();
    expect(parseCoords(params({}))).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseCoords(params({ lat: "not-a-number", lon: "17.9" }))).toBeNull();
  });

  it("rejects Infinity/NaN-producing input", () => {
    expect(parseCoords(params({ lat: "Infinity", lon: "17.9" }))).toBeNull();
    expect(parseCoords(params({ lat: "NaN", lon: "17.9" }))).toBeNull();
  });

  it("rejects out-of-range latitude/longitude", () => {
    expect(parseCoords(params({ lat: "91", lon: "0" }))).toBeNull();
    expect(parseCoords(params({ lat: "-91", lon: "0" }))).toBeNull();
    expect(parseCoords(params({ lat: "0", lon: "181" }))).toBeNull();
    expect(parseCoords(params({ lat: "0", lon: "-181" }))).toBeNull();
  });

  it("accepts boundary values", () => {
    expect(parseCoords(params({ lat: "90", lon: "180" }))).toEqual({ lat: 90, lon: 180 });
    expect(parseCoords(params({ lat: "-90", lon: "-180" }))).toEqual({ lat: -90, lon: -180 });
  });
});
