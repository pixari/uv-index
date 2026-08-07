"use client";

import { useTranslations } from "next-intl";
import { uvLevel, RISK_TEXT_COLOR } from "@/lib/uvLevel";
import type { DailyPeak } from "@/lib/dailyForecast";

export default function DailyForecast({
  days,
  locale,
}: {
  days: DailyPeak[];
  locale: string;
}) {
  const t = useTranslations("learn");
  if (days.length === 0) return null;

  return (
    <div className="flex gap-2">
      {days.map((d, i) => {
        const level = uvLevel(d.uv);
        const date = new Date(d.date);
        const label =
          i === 0 ? t("forecast.today") : date.toLocaleDateString(locale, { weekday: "short" });
        return (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-3"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <span
              className="text-xl font-semibold tabular-nums"
              style={{ color: RISK_TEXT_COLOR[level] }}
            >
              {Math.round(d.uv)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
