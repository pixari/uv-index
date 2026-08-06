export type DailyPeak = { date: string; uv: number };

/**
 * Groups an hourly/6-hourly timeseries into per-day peak UV, using the
 * browser's local calendar day (not UTC) so "today" and "tomorrow" line
 * up with what the person actually sees outside their window.
 */
export function groupDailyPeaks(
  points: { time: string; uv: number }[],
  maxDays = 5,
): DailyPeak[] {
  const byDay = new Map<string, DailyPeak>();

  for (const p of points) {
    const d = new Date(p.time);
    const key = d.toDateString();
    const existing = byDay.get(key);
    if (!existing || p.uv > existing.uv) {
      byDay.set(key, { date: p.time, uv: p.uv });
    }
  }

  return Array.from(byDay.values()).slice(0, maxDays);
}
