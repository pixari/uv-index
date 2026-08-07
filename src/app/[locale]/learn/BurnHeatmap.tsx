"use client";

import { useTranslations } from "next-intl";
import { SKIN_TYPES, burnMinutes, burnUrgencyLevel } from "@/lib/skinType";
import { RISK_TEXT_COLOR } from "@/lib/uvLevel";

const UV_ROWS = [2, 4, 6, 8, 10];

function withAlpha(oklch: string, alpha: number) {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

export default function BurnHeatmap() {
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
              <th key={skinType} className="text-[11px] font-medium text-muted-foreground">
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
                    className="rounded-lg py-1.5 font-semibold tabular-nums"
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
