import { beforeEach, describe, expect, it } from "vitest";
import { getSavedPlaces, isSaved, removeSavedPlace, samePlaceId, savePlace } from "./savedPlaces";

beforeEach(() => {
  localStorage.clear();
});

describe("savePlace", () => {
  it("adds a new place and returns it with a derived id", () => {
    const saved = savePlace({ label: "Roma", lat: 41.9, lon: 12.5 });
    expect(saved.label).toBe("Roma");
    expect(getSavedPlaces()).toEqual([saved]);
  });

  it("updates the label instead of duplicating when the coordinates already exist", () => {
    savePlace({ label: "Roma", lat: 41.9, lon: 12.5 });
    const updated = savePlace({ label: "Roma (centro)", lat: 41.9, lon: 12.5 });

    const places = getSavedPlaces();
    expect(places).toHaveLength(1);
    expect(places[0].label).toBe("Roma (centro)");
    expect(places[0].id).toBe(updated.id);
  });

  it("treats coordinates within the same ~1.1km grid cell as the same place", () => {
    const first = savePlace({ label: "Roma", lat: 41.9001, lon: 12.5001 });
    const second = savePlace({ label: "Roma", lat: 41.9003, lon: 12.4999 });
    expect(second.id).toBe(first.id);
    expect(getSavedPlaces()).toHaveLength(1);
  });
});

describe("removeSavedPlace", () => {
  it("removes only the matching place", () => {
    const a = savePlace({ label: "Roma", lat: 41.9, lon: 12.5 });
    const b = savePlace({ label: "Milano", lat: 45.46, lon: 9.19 });

    removeSavedPlace(a.id);

    expect(getSavedPlaces()).toEqual([b]);
  });
});

describe("isSaved", () => {
  it("reflects whether a coordinate pair is already saved", () => {
    expect(isSaved(41.9, 12.5)).toBe(false);
    savePlace({ label: "Roma", lat: 41.9, lon: 12.5 });
    expect(isSaved(41.9, 12.5)).toBe(true);
  });
});

describe("samePlaceId", () => {
  it("matches an id derived from the same rounded coordinates", () => {
    const saved = savePlace({ label: "Roma", lat: 41.9, lon: 12.5 });
    expect(samePlaceId(41.9, 12.5, saved.id)).toBe(true);
    expect(samePlaceId(45.46, 9.19, saved.id)).toBe(false);
  });
});
