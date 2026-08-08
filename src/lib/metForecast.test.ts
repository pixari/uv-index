import { afterEach, describe, expect, it, vi } from "vitest";
import { currentUvFrom, currentWeatherFrom, fetchCurrentUv, fetchMetTimeseries } from "./metForecast";

function entry(details: {
  ultraviolet_index_clear_sky?: number;
  air_temperature?: number;
  cloud_area_fraction?: number;
}) {
  return { time: "2026-08-08T12:00:00Z", data: { instant: { details } } };
}

describe("currentUvFrom", () => {
  it("reads the UV value off the first timeseries entry", () => {
    expect(currentUvFrom([entry({ ultraviolet_index_clear_sky: 6.4 })])).toBe(6.4);
  });

  it("returns null for an empty timeseries or a missing field", () => {
    expect(currentUvFrom([])).toBeNull();
    expect(currentUvFrom([entry({})])).toBeNull();
  });
});

describe("currentWeatherFrom", () => {
  it("reads temperature and cloud cover off the first entry", () => {
    expect(
      currentWeatherFrom([entry({ air_temperature: 24.1, cloud_area_fraction: 37 })]),
    ).toEqual({ temperature: 24.1, cloudCover: 37 });
  });

  it("returns nulls for an empty timeseries or missing fields", () => {
    expect(currentWeatherFrom([])).toEqual({ temperature: null, cloudCover: null });
    expect(currentWeatherFrom([entry({})])).toEqual({ temperature: null, cloudCover: null });
  });
});

describe("fetchMetTimeseries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the timeseries and updatedAt on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          properties: {
            timeseries: [entry({ ultraviolet_index_clear_sky: 5 })],
            meta: { updated_at: "2026-08-08T11:00:00Z" },
          },
        }),
      }),
    );

    const result = await fetchMetTimeseries(41.9, 12.5);
    expect(result?.updatedAt).toBe("2026-08-08T11:00:00Z");
    expect(currentUvFrom(result?.timeseries ?? [])).toBe(5);
  });

  it("returns null (not a throw) on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchMetTimeseries(41.9, 12.5)).toBeNull();
  });

  it("returns null (not a throw) on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await fetchMetTimeseries(41.9, 12.5)).toBeNull();
  });
});

describe("fetchCurrentUv", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the current UV from a successful fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          properties: { timeseries: [entry({ ultraviolet_index_clear_sky: 8.2 })] },
        }),
      }),
    );
    expect(await fetchCurrentUv(41.9, 12.5)).toBe(8.2);
  });

  it("resolves null when the upstream fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await fetchCurrentUv(41.9, 12.5)).toBeNull();
  });
});
