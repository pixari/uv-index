"use client";

import { useTranslations } from "next-intl";
import { SKIN_TYPES, SKIN_TONE_SWATCH } from "@/lib/skinType";
import { VITAMIN_D_MINUTES_BY_TYPE, vitaminDMinutes } from "@/lib/vitaminD";

// Same bar-list shape as ReflectanceChart, with a skin-tone swatch per row
// instead of a bare label — the swatches are the same illustrative set
// already used in Settings' skin-type picker.
export default function VitaminDChart() {
  const t = useTranslations("learn.vitaminD");
  const max = Math.max(...Object.values(VITAMIN_D_MINUTES_BY_TYPE));

  return (
    <div className="flex flex-col gap-2.5" role="img" aria-label="Average minutes to produce 1000 IU of vitamin D, by skin type">
      {SKIN_TYPES.map((skinType) => {
        const minutes = vitaminDMinutes(skinType);
        return (
          <div key={skinType} className="flex items-center gap-3">
            <span className="flex w-16 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: SKIN_TONE_SWATCH[skinType] }}
              />
              {t("skinTypeLabel", { skinType })}
            </span>
            <div className="flex-1 rounded-full bg-surface">
              <div
                className="h-2.5 rounded-full bg-brand transition-[width]"
                style={{ width: `${(VITAMIN_D_MINUTES_BY_TYPE[skinType] / max) * 100}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
              {minutes} min
            </span>
          </div>
        );
      })}
    </div>
  );
}
