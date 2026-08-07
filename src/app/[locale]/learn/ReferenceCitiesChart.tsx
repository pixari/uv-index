"use client";

import { useTranslations } from "next-intl";
import { uvLevel, RISK_TEXT_COLOR } from "@/lib/uvLevel";

type Entry = { key: string; label: string; uv: number; isYou: boolean };

export default function ReferenceCitiesChart({ entries }: { entries: Entry[] }) {
  const t = useTranslations("learn.worldCompare");
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.uv - a.uv);
  const max = Math.max(...sorted.map((e) => e.uv), 1);

  return (
    <div className="flex flex-col gap-2.5" role="img" aria-label="Current UV index, your location compared to reference cities around the world">
      {sorted.map((e) => {
        const color = RISK_TEXT_COLOR[uvLevel(e.uv)];
        return (
          <div key={e.key} className="flex items-center gap-3">
            <span
              className={
                "w-24 shrink-0 truncate text-xs " +
                (e.isYou ? "font-semibold text-foreground" : "text-muted-foreground")
              }
            >
              {e.isYou ? t("you") : e.label}
            </span>
            <div className="flex-1 rounded-full bg-surface">
              <div
                className="h-2.5 rounded-full transition-[width]"
                style={{ width: `${(e.uv / max) * 100}%`, backgroundColor: color }}
              />
            </div>
            <span
              className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums"
              style={{ color }}
            >
              {Math.round(e.uv)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
