"use client";

import { useTranslations } from "next-intl";
import { SKIN_TYPES, burnMinutes, burnUrgencyLevel, type SkinType } from "@/lib/skinType";
import { RISK_TEXT_COLOR } from "@/lib/uvLevel";

const UV_ROWS = [2, 4, 6, 8, 10];

function withAlpha(oklch: string, alpha: number) {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

// `highlightSkinType` picks out the viewer's own column (the active
// profile's skin type, passed down from LearnClient) — the rest of the
// grid stays a general reference table, this just answers "which one is
// me" at a glance. Omitted entirely (no highlight) for infants, since the
// whole burn-time concept doesn't apply to that age group.
export default function BurnHeatmap({
  highlightSkinType,
}: {
  highlightSkinType?: SkinType | null;
}) {
  const t = useTranslations("learn.burnHeatmap");

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[340px] border-separate border-spacing-1 text-center text-xs">
        <thead>
          <tr>
            <th className="text-left text-[11px] font-medium text-muted-foreground">
              {t("uvHeader")}
            </th>
            {SKIN_TYPES.map((skinType) => (
              <th
                key={skinType}
                className={
                  skinType === highlightSkinType
                    ? "text-[11px] font-semibold text-brand-ink"
                    : "text-[11px] font-medium text-muted-foreground"
                }
              >
                {t("skinTypeHeader", { skinType })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {UV_ROWS.map((uv) => (
            <tr key={uv}>
              <th scope="row" className="pr-1 text-left text-[11px] font-medium text-muted-foreground">
                {uv}
              </th>
              {SKIN_TYPES.map((skinType) => {
                const minutes = burnMinutes(skinType, uv);
                if (minutes === null) return <td key={skinType} />;
                const level = burnUrgencyLevel(minutes);
                return (
                  <td
                    key={skinType}
                    className={
                      "rounded-lg py-1.5 font-semibold tabular-nums" +
                      (skinType === highlightSkinType ? " ring-2 ring-brand" : "")
                    }
                    style={{
                      backgroundColor: withAlpha(RISK_TEXT_COLOR[level], 0.14),
                      color: RISK_TEXT_COLOR[level],
                    }}
                  >
                    {minutes}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
