import { afterEach, describe, expect, it, vi } from "vitest";
import { currentUvFrom, currentWeatherFrom, fetchCurrentUv, fetchMetTimeseries } from "./metForecast";

function entry(details: {
  ultraviolet_index_clear_sky?: number;
  air_temperature?: number;
  cloud_area_fraction?: number;
}) {
  return { time: "2026-08-08T12:00:00Z", data: { instant: { details } } };
}

// A distinct time per entry, for the interpolation tests below —
// `entry()` above hardcodes one timestamp, which is enough for the
// single-point cases but not for testing interpolation between two.
function entryAt(time: string, details: Parameters<typeof entry>[0]) {
  return { time, data: { instant: { details } } };
}

describe("currentUvFrom", () => {
  it("reads the UV value off the first timeseries entry when it's the only one", () => {
    expect(currentUvFrom([entry({ ultraviolet_index_clear_sky: 6.4 })])).toBe(6.4);
  });

  it("returns null for an empty timeseries or a missing field", () => {
    expect(currentUvFrom([])).toBeNull();
    expect(currentUvFrom([entry({})])).toBeNull();
  });

  it("interpolates between the two entries bracketing `now`, not just taking the first one", () => {
    const timeseries = [
      entryAt("2026-08-08T12:00:00Z", { ultraviolet_index_clear_sky: 4 }),
      entryAt("2026-08-08T13:00:00Z", { ultraviolet_index_clear_sky: 6 }),
    ];
    // Halfway between the two hourly points.
    const now = new Date("2026-08-08T12:30:00Z").getTime();
    expect(currentUvFrom(timeseries, now)).toBe(5);
  });

  it("regression: a stale-but-cached first entry no longer under-reports the current UV", () => {
    // This is the actual bug: timeseries[0] is MET's most recent
    // *past* hourly entry, which — especially once the 30-minute
    // response cache is factored in — can be up to ~90 minutes old by
    // the time anyone sees it. During the morning rise toward solar
    // noon, blindly using timeseries[0] reads meaningfully lower than
    // the true current UV.
    const timeseries = [
      entryAt("2026-08-08T09:00:00Z", { ultraviolet_index_clear_sky: 2 }),
      entryAt("2026-08-08T10:00:00Z", { ultraviolet_index_clear_sky: 4 }),
      entryAt("2026-08-08T11:00:00Z", { ultraviolet_index_clear_sky: 6 }),
    ];
    // "Now" is 10:25 — timeseries[0] (09:00, uv=2) is what the old code
    // returned; the true value, interpolating 10:00→11:00, is 4.83.
    const now = new Date("2026-08-08T10:25:00Z").getTime();
    expect(currentUvFrom(timeseries, now)).toBe(4.83);
  });

  it("falls back to the nearest edge point when `now` is outside the timeseries range", () => {
    const timeseries = [
      entryAt("2026-08-08T12:00:00Z", { ultraviolet_index_clear_sky: 4 }),
      entryAt("2026-08-08T13:00:00Z", { ultraviolet_index_clear_sky: 6 }),
    ];
    expect(currentUvFrom(timeseries, new Date("2026-08-08T20:00:00Z").getTime())).toBe(6);
    expect(currentUvFrom(timeseries, new Date("2026-08-08T05:00:00Z").getTime())).toBe(4);
  });
});

describe("currentWeatherFrom", () => {
  it("reads temperature and cloud cover off the first entry when it's the only one", () => {
    expect(
      currentWeatherFrom([entry({ air_temperature: 24.1, cloud_area_fraction: 37 })]),
    ).toEqual({ temperature: 24.1, cloudCover: 37 });
  });

  it("returns nulls for an empty timeseries or missing fields", () => {
    expect(currentWeatherFrom([])).toEqual({ temperature: null, cloudCover: null });
    expect(currentWeatherFrom([entry({})])).toEqual({ temperature: null, cloudCover: null });
  });

  it("interpolates temperature and cloud cover the same way UV does", () => {
    const timeseries = [
      entryAt("2026-08-08T12:00:00Z", { air_temperature: 20, cloud_area_fraction: 10 }),
      entryAt("2026-08-08T13:00:00Z", { air_temperature: 24, cloud_area_fraction: 30 }),
    ];
    const now = new Date("2026-08-08T12:30:00Z").getTime();
    expect(currentWeatherFrom(timeseries, now)).toEqual({ temperature: 22, cloudCover: 20 });
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
