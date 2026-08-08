import { uvLevel } from "./uvLevel";

type LowRiskWindow = { start: string; end: string };

/**
 * Finds contiguous stretches of low-risk UV (below 3) in an hourly
 * timeseries — the safest windows to be outside without protection.
 * Adjacent low-risk hours are merged into a single range.
 */
export function findLowRiskWindows(
  points: { time: string; uv: number }[],
): LowRiskWindow[] {
  const windows: LowRiskWindow[] = [];
  let start: string | null = null;
  let prevTime: string | null = null;

  for (const p of points) {
    const low = uvLevel(p.uv) === "low";
    if (low && start === null) {
      start = p.time;
    } else if (!low && start !== null) {
      windows.push({ start, end: prevTime ?? start });
      start = null;
    }
    prevTime = p.time;
  }
  if (start !== null && prevTime !== null) {
    windows.push({ start, end: prevTime });
  }

  return windows;
}
