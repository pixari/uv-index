// Antarctic ozone hole maximum area, one point per year, million km².
// Real published figures (rounded to the precision each source actually
// reports) from NASA Ozone Watch / NOAA annual releases and the WMO/UNEP
// 2022 Scientific Assessment of Ozone Depletion — not estimated or
// interpolated. Picked years bracket the story: pre-peak, peak, and the
// Montreal-Protocol-driven decline since.
export type OzonePoint = { year: number; areaMillionKm2: number };

export const OZONE_HOLE_AREA: OzonePoint[] = [
  { year: 1985, areaMillionKm2: 20 },
  { year: 2000, areaMillionKm2: 29.8 },
  { year: 2006, areaMillionKm2: 29.6 }, // largest on record
  { year: 2015, areaMillionKm2: 28.2 },
  { year: 2020, areaMillionKm2: 25 },
  { year: 2024, areaMillionKm2: 22.4 },
  { year: 2025, areaMillionKm2: 21.1 }, // 5th-smallest since 1992
];

// WMO/UNEP 2022 Scientific Assessment of Ozone Depletion: projected year
// the ozone layer recovers to its 1980 baseline, assuming current policy
// (i.e. continued compliance with the Montreal Protocol) holds.
export const OZONE_RECOVERY_YEAR_ANTARCTIC = 2066;

export const OZONE_SOURCE_URL = "https://ozonewatch.gsfc.nasa.gov/";
