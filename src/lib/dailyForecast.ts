export type DailyPeak = { date: string; uv: number };

// Below this many samples, a day's bucket can't be trusted to have caught
// its actual midday peak.
const MIN_SAMPLES_FOR_PEAK = 3;

// A day's true peak is essentially always at/near solar noon. The upstream
// timeseries steps down to 6-hourly synoptic samples (roughly 00/06/12/18)
// past the first ~2.5 days, and depending on exactly where those land
// locally, a day can end up with 3+ samples that are all dawn/dusk/night —
// enough to pass a bare count check, but the "peak" among them is really
// just a low edge-of-daylight value (e.g. 1 or 3), not that day's actual
// high. Require at least one sample in this local-hour window before
// trusting a day's peak at all.
const MIDDAY_START_HOUR = 10;
const MIDDAY_END_HOUR = 16;

/**
 * Groups an hourly/6-hourly timeseries into per-day peak UV, using the
 * browser's local calendar day (not UTC) so "today" and "tomorrow" line
 * up with what the person actually sees outside their window.
 */
export function groupDailyPeaks(
  points: { time: string; uv: number }[],
  maxDays = 5,
): DailyPeak[] {
  const byDay = new Map<
    string,
    { peak: DailyPeak; count: number; sawMidday: boolean }
  >();

  for (const p of points) {
    const d = new Date(p.time);
    const key = d.toDateString();
    const hour = d.getHours();
    const isMidday = hour >= MIDDAY_START_HOUR && hour <= MIDDAY_END_HOUR;
    const existing = byDay.get(key);
    if (!existing) {
      byDay.set(key, { peak: { date: p.time, uv: p.uv }, count: 1, sawMidday: isMidday });
    } else {
      existing.count += 1;
      if (isMidday) existing.sawMidday = true;
      if (p.uv > existing.peak.uv) existing.peak = { date: p.time, uv: p.uv };
    }
  }

  const days = Array.from(byDay.values());

  // Drop any day (wherever it falls in the sequence, not just the end)
  // that can't be trusted to have caught its real peak, rather than show a
  // misleadingly low number. Day 0 (today) is exempt: it's expected to be
  // partial, since the API only ever returns hours still ahead of "now".
  const reliable = days.filter(
    (d, i) => i === 0 || (d.count >= MIN_SAMPLES_FOR_PEAK && d.sawMidday),
  );

  return reliable.slice(0, maxDays).map((d) => d.peak);
}
