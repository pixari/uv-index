"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { findLowRiskWindows } from "@/lib/bestWindow";
import { groupDailyPeaks, type DailyPeak } from "@/lib/dailyForecast";
import { OZONE_HOLE_AREA, OZONE_RECOVERY_YEAR_ANTARCTIC, OZONE_SOURCE_URL } from "@/lib/ozoneData";
import { UV_REFLECTANCE, UV_INCREASE_PERCENT_PER_1000M, UV_PHYSICS_SOURCE_URL } from "@/lib/uvPhysics";
import { IARC_TIMELINE } from "@/lib/iarcTimeline";
import DailyForecast from "./DailyForecast";
import UvDayChart from "./UvDayChart";
import OzoneChart from "./OzoneChart";
import ReflectanceChart from "./ReflectanceChart";
import BurnHeatmap from "./BurnHeatmap";
import ReferenceCitiesChart from "./ReferenceCitiesChart";
import IarcTimeline from "./IarcTimeline";
import ArticleShareButton from "./ArticleShareButton";
import WhoGradientBar from "./WhoGradientBar";

const LAST_PLACE_KEY = "uv-index:last-place";

type Coords = { lat: number; lon: number; label: string };
type Point = { time: string; uv: number };
type ReferenceReading = { key: string; uv: number | null };

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Section header shared by every "article" (has a title + a share button
// pointing at its own #anchor) — the two live-data utility sections above
// it (today's chart, upcoming days) intentionally don't get one, since
// they're a personal snapshot rather than something to read and pass on.
function ArticleHeader({
  title,
  shareText,
  anchor,
}: {
  title: string;
  shareText: string;
  anchor: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <h2 className="font-display text-2xl leading-tight">{title}</h2>
      <ArticleShareButton text={shareText} anchor={anchor} />
    </div>
  );
}

export default function LearnClient() {
  const t = useTranslations("learn");
  const locale = useLocale();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [points, setPoints] = useState<Point[] | null>(null);
  const [dailyPeaks, setDailyPeaks] = useState<DailyPeak[]>([]);
  const [referenceReadings, setReferenceReadings] = useState<ReferenceReading[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LAST_PLACE_KEY);
    if (!saved) return;
    const parsed: Coords = JSON.parse(saved);
    setCoords(parsed);
    fetch(`/api/uv-timeseries?lat=${parsed.lat}&lon=${parsed.lon}&hours=120`)
      .then((r) => r.json())
      .then((d) => {
        const all: Point[] = d.today ?? [];
        setPoints(all.slice(0, 24));
        setDailyPeaks(groupDailyPeaks(all, 5));
      })
      .catch(() => setPoints([]));

    fetch("/api/uv-reference")
      .then((r) => r.json())
      .then((d) => setReferenceReadings(d.cities ?? []))
      .catch(() => setReferenceReadings([]));
  }, []);

  const yourUv = points && points.length > 0 ? points[0].uv : null;
  const worldCompareEntries =
    yourUv !== null
      ? [
          { key: "you", label: t("worldCompare.you"), uv: yourUv, isYou: true },
          ...referenceReadings
            .filter((r) => r.uv !== null)
            .map((r) => ({
              key: r.key,
              label: t(`worldCompare.cities.${r.key}`),
              uv: r.uv as number,
              isYou: false,
            })),
        ]
      : [];

  return (
    // A soft brand-tinted wash behind just the hero, fading out well
    // before the TOC — a nod to Home's colorful sky without turning a
    // long reading page into something busy (DESIGN.md: calm, not
    // garish). Brand color has no semantic meaning to protect (unlike
    // the WHO risk scale), so it's free to use decoratively here.
    <main
      className="mx-auto max-w-xl px-6 py-10"
      style={{
        background:
          "linear-gradient(to bottom, oklch(0.48 0.15 230 / 0.08), oklch(0.48 0.15 230 / 0) 480px)",
      }}
    >
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground hover:text-brand-ink transition-colors"
      >
        {t("back")}
      </Link>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink">
        {t("eyebrow")}
      </p>
      <h1 className="font-display text-5xl leading-[1.05] mb-6">
        {t("title")}
      </h1>

      <div className="mb-8">
        <WhoGradientBar />
      </div>

      <nav
        className="mb-12 rounded-2xl border border-brand/15 bg-brand/[0.04] p-4"
        aria-label={t("toc.title")}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("toc.title")}
        </p>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {(["chart", "forecast", "methodology", "physics", "worldCompare", "spf", "burnHeatmap", "ozone", "iarc"] as const).map(
            (key) => (
              <li key={key}>
                <a href={`#${key}`} className="text-sm text-ink hover:text-brand-ink hover:underline">
                  {t(`toc.${key}`)}
                </a>
              </li>
            ),
          )}
        </ul>
      </nav>

      {points && points.length > 1 && (
        <section id="chart" className="mb-12 scroll-mt-20">
          <h2 className="font-display text-xl mb-1">
            {t("chart.title")}
          </h2>
          {coords && (
            <p className="mb-4 text-sm text-muted-foreground">
              {t("chart.subtitle", { place: coords.label })}
            </p>
          )}
          <UvDayChart points={points} />

          {(() => {
            const windows = findLowRiskWindows(points);
            return (
              <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {t("bestWindow.title")}
                </p>
                {windows.length > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {windows
                      .map(
                        (w) =>
                          `${formatTime(w.start, locale)}–${formatTime(w.end, locale)}`,
                      )
                      .join(", ")}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("bestWindow.none")}
                  </p>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {dailyPeaks.length > 1 && (
        <section id="forecast" className="mb-12 scroll-mt-20">
          <h2 className="font-display text-xl mb-1">{t("forecast.title")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("forecast.subtitle")}
          </p>
          <DailyForecast days={dailyPeaks} locale={locale} />
        </section>
      )}

      <article id="methodology" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("methodology.title")} shareText={t("methodology.shareText")} anchor="methodology" />
        <div className="space-y-4 text-ink leading-relaxed">
          <p>{t("methodology.p1")}</p>
          <p>{t("methodology.p2")}</p>
          <p>{t("methodology.p3")}</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("methodology.source")}{" "}
          <a
            href="https://www.who.int/publications/i/item/9241590076"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-ink hover:underline"
          >
            WHO/WMO/UNEP/ICNIRP
          </a>
        </p>
      </article>

      <article id="physics" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("physics.title")} shareText={t("physics.shareText")} anchor="physics" />
        <div className="space-y-4 text-ink leading-relaxed">
          <p>{t("physics.p1", { percent: UV_INCREASE_PERCENT_PER_1000M })}</p>
          <p>{t("physics.p2")}</p>
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("physics.chartCaption")}
          </p>
          <ReflectanceChart surfaces={UV_REFLECTANCE} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("physics.source")}{" "}
          <a
            href={UV_PHYSICS_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-ink hover:underline"
          >
            WHO/WMO/UNEP/ICNIRP
          </a>
        </p>
      </article>

      {worldCompareEntries.length > 1 && (
        <article id="worldCompare" className="mb-14 scroll-mt-20">
          <ArticleHeader
            title={t("worldCompare.title")}
            shareText={t("worldCompare.shareText")}
            anchor="worldCompare"
          />
          <p className="mb-4 text-ink leading-relaxed">{t("worldCompare.subtitle")}</p>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <ReferenceCitiesChart entries={worldCompareEntries} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("worldCompare.note")}</p>
        </article>
      )}

      <article id="spf" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("spf.title")} shareText={t("spf.shareText")} anchor="spf" />
        <div className="space-y-4 text-ink leading-relaxed">
          <p>{t("spf.p1")}</p>
          <p>{t("spf.p2")}</p>
          <p>{t("spf.p3")}</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("spf.source")}{" "}
          <a
            href="https://www.aad.org/media/stats-sunscreen"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-ink hover:underline"
          >
            American Academy of Dermatology
          </a>
        </p>
      </article>

      <article id="burnHeatmap" className="mb-14 scroll-mt-20">
        <ArticleHeader
          title={t("burnHeatmap.title")}
          shareText={t("burnHeatmap.shareText")}
          anchor="burnHeatmap"
        />
        <p className="mb-4 text-ink leading-relaxed">{t("burnHeatmap.p1")}</p>
        <BurnHeatmap />
        <p className="mt-4 text-sm text-muted-foreground">{t("burnHeatmap.source")}</p>
      </article>

      <article id="ozone" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("ozone.title")} shareText={t("ozone.shareText")} anchor="ozone" />
        <div className="space-y-4 text-ink leading-relaxed">
          <p>{t("ozone.p1")}</p>
          <p>{t("ozone.p2", { year: OZONE_RECOVERY_YEAR_ANTARCTIC })}</p>
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("ozone.chartCaption")}
          </p>
          <OzoneChart points={OZONE_HOLE_AREA} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("ozone.source")}{" "}
          <a
            href={OZONE_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-ink hover:underline"
          >
            NASA Ozone Watch
          </a>
        </p>
      </article>

      <article id="iarc" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("iarc.title")} shareText={t("iarc.shareText")} anchor="iarc" />
        <p className="mb-6 text-ink leading-relaxed">{t("iarc.intro")}</p>
        <IarcTimeline milestones={IARC_TIMELINE} />
      </article>
    </main>
  );
}
