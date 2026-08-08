"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OZONE_HOLE_AREA, OZONE_RECOVERY_YEAR_ANTARCTIC, OZONE_SOURCE_URL } from "@/lib/ozoneData";
import { UV_REFLECTANCE, UV_INCREASE_PERCENT_PER_1000M, UV_PHYSICS_SOURCE_URL } from "@/lib/uvPhysics";
import { IARC_TIMELINE } from "@/lib/iarcTimeline";
import { MYTH_KEYS, MYTH_SOURCES } from "@/lib/mythSources";
import { VITAMIN_D_SOURCE_URL } from "@/lib/vitaminD";
import { EEA_AQI_SOURCE_URL, OPEN_METEO_AIR_QUALITY_DOCS_URL } from "@/lib/airQuality";
import { getLastPlace } from "@/lib/lastPlace";
import { getProfiles, resolveActiveProfileId } from "@/lib/profiles";
import type { SkinType } from "@/lib/skinType";
import OzoneChart from "./OzoneChart";
import ReflectanceChart from "./ReflectanceChart";
import BurnHeatmap from "./BurnHeatmap";
import VitaminDChart from "./VitaminDChart";
import AqiScale from "./AqiScale";
import ReferenceCitiesChart from "./ReferenceCitiesChart";
import IarcTimeline from "./IarcTimeline";
import ArticleShareButton from "./ArticleShareButton";
import WhoGradientBar from "./WhoGradientBar";
import ScrollProgress from "./ScrollProgress";

type ReferenceReading = { key: string; uv: number | null };

// Every scientific claim in this section has its own inline citation
// already (see each article's "Source:" line) — this list exists so
// someone can also scan every source in one place, deduped by URL since a
// few (WHO, AAD) get cited more than once above.
const SOURCES_LIST = (() => {
  const raw = [
    { label: "WHO/WMO/UNEP/ICNIRP — Global Solar UV Index: A Practical Guide", url: UV_PHYSICS_SOURCE_URL },
    ...MYTH_KEYS.map((key) => ({ label: MYTH_SOURCES[key].label, url: MYTH_SOURCES[key].url })),
    {
      label: "American Academy of Dermatology — Sunscreen statistics",
      url: "https://www.aad.org/media/stats-sunscreen",
    },
    { label: "NASA Ozone Watch", url: OZONE_SOURCE_URL },
    {
      label: "IARC Monographs, Volume 55 — Solar and Ultraviolet Radiation",
      url: IARC_TIMELINE[0].url,
    },
    { label: "IARC Monographs, Volume 100D — UV tanning devices", url: IARC_TIMELINE[1].url },
    {
      label: "Kallioğlu et al. 2024, Scientific Reports 14:3541 — vitamin D3 synthesis model",
      url: VITAMIN_D_SOURCE_URL,
    },
    { label: "European Environment Agency — European Air Quality Index", url: EEA_AQI_SOURCE_URL },
    { label: "Open-Meteo — Air Quality API documentation", url: OPEN_METEO_AIR_QUALITY_DOCS_URL },
  ];
  const seen = new Set<string>();
  return raw.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
})();

// Section header shared by every "article" (has a title + a share button
// pointing at its own #anchor).
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
      <h2 className="min-w-0 flex-1 break-words font-display text-2xl leading-tight">
        {title}
      </h2>
      <ArticleShareButton text={shareText} anchor={anchor} />
    </div>
  );
}

export default function LearnClient() {
  const t = useTranslations("learn");
  // "defaultProfileName" lives under "home" — same cross-namespace lookup
  // SettingsSheet already does, for the same reason (the default profile
  // is created by HomeClient, before this page has ever run).
  const tHome = useTranslations("home");
  const [yourUv, setYourUv] = useState<number | null>(null);
  const [referenceReadings, setReferenceReadings] = useState<ReferenceReading[]>([]);
  const [activeSkinType, setActiveSkinType] = useState<SkinType | null>(null);

  useEffect(() => {
    const parsed = getLastPlace();
    if (!parsed) return;
    fetch(`/api/uv?lat=${parsed.lat}&lon=${parsed.lon}`)
      .then((r) => r.json())
      .then((d) => setYourUv(typeof d.uv === "number" ? d.uv : null))
      .catch(() => setYourUv(null));

    fetch("/api/uv-reference")
      .then((r) => r.json())
      .then((d) => setReferenceReadings(d.cities ?? []))
      .catch(() => setReferenceReadings([]));
  }, []);

  // Personalizes the burn-time heatmap below with the viewer's own skin
  // type, same source SettingsSheet/HomeClient read from — but not for an
  // infant profile, since the whole burn-time concept doesn't apply there.
  useEffect(() => {
    const defaultName = tHome("defaultProfileName");
    const list = getProfiles(defaultName);
    const activeId = resolveActiveProfileId(defaultName);
    const active = list.find((p) => p.id === activeId);
    setActiveSkinType(active && !active.isInfant ? active.skinType : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      id="learnTop"
      className="mx-auto max-w-xl px-6 py-10"
      style={{
        background:
          "linear-gradient(to bottom, oklch(0.48 0.15 230 / 0.08), oklch(0.48 0.15 230 / 0) 480px)",
      }}
    >
      <ScrollProgress />

      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground hover:text-brand-ink transition-colors"
      >
        {t("back")}
      </Link>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink">
        {t("eyebrow")}
      </p>
      {/* break-words: a single long, space-less word in some locale (e.g.
          Italian "Approfondimenti") won't wrap on its own at this size and
          otherwise overflows past the right edge instead. */}
      <h1 className="break-words font-display text-5xl leading-[1.05] mb-6">
        {t("title")}
      </h1>

      <div className="mb-8">
        <WhoGradientBar />
      </div>

      {/* Live personal data (hourly chart, upcoming days, vitamin D
          window) now lives in the app's own Forecast panel, not here —
          this page stays the citable, shareable reading, and doesn't
          duplicate data that's a tap away for anyone who's already using
          the app. */}
      <div className="mb-10 flex items-center justify-between gap-4 rounded-2xl border border-brand/15 bg-brand/[0.04] p-4">
        <div>
          <p className="text-sm font-medium text-foreground">{t("openApp.title")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("openApp.body")}</p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm font-medium text-brand-ink hover:underline"
        >
          {t("openApp.cta")}
        </Link>
      </div>

      <nav
        className="mb-12 rounded-2xl border border-brand/15 bg-brand/[0.04] p-4"
        aria-label={t("toc.title")}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("toc.title")}
        </p>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {(
            [
              "methodology",
              "physics",
              "vitaminD",
              "worldCompare",
              "spf",
              "myths",
              "burnHeatmap",
              "airQuality",
              "ozone",
              "iarc",
              "sources",
            ] as const
          ).map((key) => (
            <li key={key}>
              <a href={`#${key}`} className="text-sm text-ink hover:text-brand-ink hover:underline">
                {t(`toc.${key}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

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

      <article id="vitaminD" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("vitaminD.title")} shareText={t("vitaminD.shareText")} anchor="vitaminD" />
        <div className="space-y-4 text-ink leading-relaxed">
          <p>{t("vitaminD.p1")}</p>
          <p>{t("vitaminD.p2")}</p>
          <p>{t("vitaminD.p3")}</p>
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("vitaminD.chartCaption")}
          </p>
          <VitaminDChart />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("vitaminD.source")}{" "}
          <a
            href={VITAMIN_D_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-ink hover:underline"
          >
            Scientific Reports (Nature), 2024
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

      <article id="myths" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("myths.title")} shareText={t("myths.shareText")} anchor="myths" />
        <p className="mb-5 text-ink leading-relaxed">{t("myths.intro")}</p>
        <div className="flex flex-col gap-4">
          {MYTH_KEYS.map((key) => (
            <div key={key} className="rounded-2xl border border-border bg-surface p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("myths.mythLabel")}
              </p>
              <p className="mb-3 text-sm font-medium text-foreground">
                {t(`myths.items.${key}.myth`)}
              </p>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-ink">
                {t("myths.factLabel")}
              </p>
              <p className="mb-3 text-sm leading-relaxed text-ink">
                {t(`myths.items.${key}.fact`)}
              </p>
              <a
                href={MYTH_SOURCES[key].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-brand-ink hover:underline"
              >
                {t("myths.sourceLabel")}: {MYTH_SOURCES[key].label}
              </a>
            </div>
          ))}
        </div>
      </article>

      <article id="burnHeatmap" className="mb-14 scroll-mt-20">
        <ArticleHeader
          title={t("burnHeatmap.title")}
          shareText={t("burnHeatmap.shareText")}
          anchor="burnHeatmap"
        />
        <p className="mb-4 text-ink leading-relaxed">{t("burnHeatmap.p1")}</p>
        <BurnHeatmap highlightSkinType={activeSkinType} />
        <p className="mt-4 text-sm text-muted-foreground">{t("burnHeatmap.source")}</p>
      </article>

      <article id="airQuality" className="mb-14 scroll-mt-20">
        <ArticleHeader
          title={t("airQuality.title")}
          shareText={t("airQuality.shareText")}
          anchor="airQuality"
        />
        <div className="space-y-4 text-ink leading-relaxed">
          <p>{t("airQuality.p1")}</p>
          <p>{t("airQuality.p2")}</p>
          <p>{t("airQuality.p3")}</p>
        </div>
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("airQuality.categoriesCaption")}
          </p>
          <AqiScale />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("airQuality.source")}{" "}
          <a
            href={EEA_AQI_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-ink hover:underline"
          >
            European Environment Agency
          </a>{" "}
          ·{" "}
          <a
            href={OPEN_METEO_AIR_QUALITY_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-ink hover:underline"
          >
            Open-Meteo
          </a>
        </p>
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

      <section id="sources" className="mb-14 scroll-mt-20">
        <h2 className="mb-1 font-display text-2xl leading-tight">{t("sources.title")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("sources.intro")}</p>
        <ul className="space-y-2">
          {SOURCES_LIST.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border px-4 py-2.5 text-sm text-ink hover:bg-surface hover:text-brand-ink transition-colors"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* A bookend for the hero's gradient bar, and a real closing
          treatment for a page long enough to want one. */}
      <footer className="mt-4 border-t border-border pt-8 pb-2">
        <div className="mb-6">
          <WhoGradientBar />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <div
            aria-hidden
            className="h-6 w-6 shrink-0 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #3EA72D 0%, #FFF300 35%, #F18B00 65%, #E53210 100%)",
            }}
          />
          <span className="font-display text-base text-foreground">UV Index</span>
        </div>
        <p className="mb-6 max-w-[38ch] text-sm text-muted-foreground leading-relaxed">
          {t("footer.tagline")}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <a href="#learnTop" className="text-sm text-brand-ink hover:underline">
            {t("footer.backToTop")}
          </a>
          <span aria-hidden className="text-border">·</span>
          <Link href="/" className="text-sm text-brand-ink hover:underline">
            {t("footer.backToHome")}
          </Link>
          <span aria-hidden className="text-border">·</span>
          <Link href="/privacy" className="text-sm text-brand-ink hover:underline">
            {t("footer.privacyLink")}
          </Link>
          <span aria-hidden className="text-border">·</span>
          <a
            href="https://github.com/pixari/uv-index"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-ink hover:underline"
          >
            {t("footer.sourceLink")}
          </a>
        </div>
      </footer>
    </main>
  );
}
