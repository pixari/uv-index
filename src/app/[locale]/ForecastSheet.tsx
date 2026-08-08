"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { skyGradientCss, uvLevel } from "@/lib/uvLevel";
import { findLowRiskWindows } from "@/lib/bestWindow";
import { groupDailyPeaks, type DailyPeak } from "@/lib/dailyForecast";
import { burnMinutes, type SkinType } from "@/lib/skinType";
import { vitaminDMinutes, VITAMIN_D_SOURCE_URL } from "@/lib/vitaminD";
import type { LastPlace } from "@/lib/lastPlace";
import UvDayChart from "./learn/UvDayChart";
import DailyForecast from "./learn/DailyForecast";
import { GLASS_CARD } from "./glassCard";

type Point = { time: string; uv: number };

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EYEBROW = "text-xs font-semibold uppercase tracking-wide text-white/60";

// The richer content /learn already has (hourly chart, multi-day peaks) —
// reused here, restyled for Home's own dark/glass design, per the user's
// request that this live in the main app rather than the editorial page.
// A deliberate exception to sheets otherwise staying light (see
// SettingsSheet/LocationSheet): this one borrows Home's own visual
// language because that's specifically what was asked for.
export default function ForecastSheet({
  open,
  onOpenChange,
  coords,
  uv,
  skinType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coords: LastPlace | null;
  uv: number | null;
  skinType: SkinType | null;
}) {
  const t = useTranslations("home.forecastSheet");
  const tHome = useTranslations("home");
  const locale = useLocale();
  const [points, setPoints] = useState<Point[] | null>(null);
  const [dailyPeaks, setDailyPeaks] = useState<DailyPeak[]>([]);

  // Fetched only when the panel actually opens, not at Home mount — this
  // multi-day timeseries is a heavier request than Home's own
  // current-instant fetch, and its rate limit (20/60s) is meant for
  // "opened a few times a session", not "every Home load".
  useEffect(() => {
    if (!open || !coords) return;
    fetch(`/api/uv-timeseries?lat=${coords.lat}&lon=${coords.lon}&hours=120`)
      .then((r) => r.json())
      .then((d) => {
        const all: Point[] = d.today ?? [];
        setPoints(all.slice(0, 24));
        setDailyPeaks(groupDailyPeaks(all, 5));
      })
      .catch(() => {
        setPoints([]);
        setDailyPeaks([]);
      });
  }, [open, coords]);

  const windows = points ? findLowRiskWindows(points) : [];
  const burn = uv !== null && skinType ? burnMinutes(skinType, uv) : null;
  const vitD = skinType ? vitaminDMinutes(skinType) : null;
  const level = uv !== null ? uvLevel(uv) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="dark rounded-t-3xl pb-8 text-white"
        style={{ background: skyGradientCss(level) }}
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-white">
            {t("title")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4">
          {points === null ? (
            <p className="py-6 text-center text-sm text-white/70">{tHome("loading")}</p>
          ) : (
            <>
              {points.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className={EYEBROW}>{t("chartTitle")}</span>
                  <UvDayChart points={points} dark />
                </div>
              )}

              <div className={`flex flex-col gap-1 px-4 py-4 ${GLASS_CARD}`}>
                <span className={EYEBROW}>{t("bestWindow.title")}</span>
                {windows.length > 0 ? (
                  <p className="text-sm text-white/85">
                    {windows
                      .map((w) => `${formatTime(w.start, locale)}–${formatTime(w.end, locale)}`)
                      .join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-white/85">{t("bestWindow.none")}</p>
                )}
              </div>

              {dailyPeaks.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className={EYEBROW}>{t("daysTitle")}</span>
                  <DailyForecast
                    days={dailyPeaks}
                    locale={locale}
                    todayLabel={t("todayLabel")}
                    dark
                  />
                </div>
              )}
            </>
          )}

          <div className={`flex flex-col gap-2 px-5 py-5 ${GLASS_CARD}`}>
            <span className={EYEBROW}>{t("vitaminD.title")}</span>
            {skinType && vitD !== null ? (
              <>
                <p className="text-sm text-white/85">
                  {t("vitaminD.body", { minutes: vitD })}
                </p>
                {burn !== null && (
                  <p className="text-sm text-white/70">
                    {t("vitaminD.compare", { burnMinutes: burn })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-white/85">{t("vitaminD.noSkinType")}</p>
            )}
            <p className="mt-1 text-xs leading-snug text-white/55">
              {t("vitaminD.disclaimer")}
            </p>
            <a
              href={VITAMIN_D_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
            >
              {t("vitaminD.sourceLabel")}: Scientific Reports (Nature), 2024
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
