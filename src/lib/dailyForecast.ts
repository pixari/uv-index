export type DailyPeak = { date: string; uv: number };

// Below this many samples, a day's bucket can't be trusted to have caught
// its actual midday peak.
const MIN_SAMPLES_FOR_PEAK = 3;

/**
 * Groups an hourly/6-hourly timeseries into per-day peak UV, using the
 * browser's local calendar day (not UTC) so "today" and "tomorrow" line
 * up with what the person actually sees outside their window.
 */
export function groupDailyPeaks(
  points: { time: string; uv: number }[],
  maxDays = 5,
): DailyPeak[] {
  const byDay = new Map<string, { peak: DailyPeak; count: number }>();

  for (const p of points) {
    const d = new Date(p.time);
    const key = d.toDateString();
    const existing = byDay.get(key);
    if (!existing) {
      byDay.set(key, { peak: { date: p.time, uv: p.uv }, count: 1 });
    } else {
      existing.count += 1;
      if (p.uv > existing.peak.uv) existing.peak = { date: p.time, uv: p.uv };
    }
  }

  const days = Array.from(byDay.values());

  // The upstream timeseries gets coarser (and is fetched with a hard cap)
  // the further out it goes, so the final day can end up built from just
  // one or two samples that happen to land at night — reporting a
  // technically-true but misleading "0" instead of that day's real peak.
  // Drop a trailing day like that rather than show it. Day 0 (today) is
  // exempt: it's expected to be partial, since the API only ever returns
  // hours still ahead of "now".
  while (
    days.length > 1 &&
    days[days.length - 1].count < MIN_SAMPLES_FOR_PEAK
  ) {
    days.pop();
  }

  return days.slice(0, maxDays).map((d) => d.peak);
}
