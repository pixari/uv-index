"use client";

import { useTranslations } from "next-intl";
import { AQI_LEVELS } from "@/lib/airQuality";

// A plain ordered legend, not a colored heatmap: the EEA's six official
// band colors aren't independently confirmed in this codebase the way the
// WHO UV palette is (see uvLevel.ts), so this deliberately doesn't invent
// a color scale for them — severity is instead conveyed by a single hue at
// increasing opacity, least to most severe.
export default function AqiScale() {
  const t = useTranslations("learn.airQuality.categories");

  return (
    <ol className="flex flex-col gap-2">
      {AQI_LEVELS.map((level, i) => (
        <li key={level} className="flex items-center gap-3 text-sm text-ink">
          <span
            aria-hidden
            className="h-3 w-3 shrink-0 rounded-sm bg-ink"
            style={{ opacity: 0.15 + (i / (AQI_LEVELS.length - 1)) * 0.75 }}
          />
          {t(level)}
        </li>
      ))}
    </ol>
  );
}
