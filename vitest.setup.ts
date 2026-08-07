// groupDailyPeaks/findLowRiskWindows bucket by local calendar day on
// purpose (see dailyForecast.ts) — pin the test runner's timezone so
// those tests are deterministic regardless of which machine/CI runs them.
process.env.TZ = "UTC";
