"use client";

import { uvLevel, RISK_TEXT_COLOR, WHO_LEVEL_COLOR } from "@/lib/uvLevel";
import type { DailyPeak } from "@/lib/dailyForecast";

export default function DailyForecast({
  days,
  locale,
  todayLabel,
  dark = false,
}: {
  days: DailyPeak[];
  locale: string;
  // Passed in rather than read from useTranslations("learn") — this
  // component is also reused from Home's ForecastSheet, which shouldn't
  // have to couple itself to the /learn translation namespace for one label.
  todayLabel: string;
  // Home's ForecastSheet reuses these pills on dark frosted glass instead
  // of /learn's light bordered cards.
  dark?: boolean;
}) {
  if (days.length === 0) return null;

  return (
    <div className="flex gap-2">
      {days.map((d, i) => {
        const level = uvLevel(d.uv);
        const date = new Date(d.date);
        const label =
          i === 0 ? todayLabel : date.toLocaleDateString(locale, { weekday: "short" });
        return (
          <div
            key={d.date}
            className={
              dark
                ? "flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-white/12 px-2 py-3 ring-1 ring-white/15"
                : "flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-3"
            }
          >
            <span
              className={
                dark ? "text-xs font-medium text-white/60" : "text-xs font-medium text-muted-foreground"
              }
            >
              {label}
            </span>
            <span
              className="text-xl font-semibold tabular-nums"
              style={{ color: dark ? WHO_LEVEL_COLOR[level] : RISK_TEXT_COLOR[level] }}
            >
              {Math.round(d.uv)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
