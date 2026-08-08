import { beforeEach, describe, expect, it } from "vitest";
import { getLastPlace, setLastPlace } from "./lastPlace";

beforeEach(() => {
  localStorage.clear();
});

describe("getLastPlace", () => {
  it("returns null when nothing has been stored", () => {
    expect(getLastPlace()).toBeNull();
  });

  it("returns what was stored by setLastPlace", () => {
    setLastPlace({ lat: 41.9, lon: 12.5, label: "Roma" });
    expect(getLastPlace()).toEqual({ lat: 41.9, lon: 12.5, label: "Roma" });
  });

  it("returns null instead of throwing on corrupted storage", () => {
    localStorage.setItem("uv-index:last-place", "{not json");
    expect(getLastPlace()).toBeNull();
  });
});
