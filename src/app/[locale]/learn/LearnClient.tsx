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
import { BRAND_MARK_GRADIENT } from "@/lib/brandGradient";
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

// Every section in reading order — drives the TOC, the "keep reading"
// links, and which section counts as "active" while scrolling. worldCompare
// is the only one that isn't always rendered (needs live data to have
// loaded), so it's filtered out of `visibleSections` below when it's empty
// — everything else (the next-link target, the active-TOC highlight)
// derives from that one filtered list instead of re-deriving the same
// exception in three different places.
const SECTION_KEYS = [
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
  "glossary",
  "sources",
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const GLOSSARY_TERMS = [
  "uvIndex",
  "uva",
  "uvb",
  "spf",
  "broadSpectrum",
  "fitzpatrick",
  "erythema",
  "europeanAqi",
] as const;

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
  // Reused verbatim, not re-authored — a page that adds a "quick facts"
  // card and a glossary shouldn't end up with its own, slightly different
  // medical disclaimer than the one /privacy already carries.
  const tPrivacy = useTranslations("privacy");
  // "defaultProfileName" lives under "home" — same cross-namespace lookup
  // SettingsSheet already does, for the same reason (the default profile
  // is created by HomeClient, before this page has ever run).
  const tHome = useTranslations("home");
  const [yourUv, setYourUv] = useState<number | null>(null);
  const [referenceReadings, setReferenceReadings] = useState<ReferenceReading[]>([]);
  const [activeSkinType, setActiveSkinType] = useState<SkinType | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

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

  const visibleSections = SECTION_KEYS.filter(
    (key) => key !== "worldCompare" || worldCompareEntries.length > 1,
  );

  function nextSection(id: SectionKey): SectionKey | null {
    const idx = visibleSections.indexOf(id);
    if (idx === -1 || idx === visibleSections.length - 1) return null;
    return visibleSections[idx + 1];
  }

  // "Keep reading" link at the end of each section — otherwise a reader
  // has to scroll all the way back to the TOC to find what's next.
  function renderNextLink(id: SectionKey) {
    const next = nextSection(id);
    if (!next) return null;
    return (
      <a
        href={`#${next}`}
        className="mt-4 inline-block text-sm font-medium text-brand-ink hover:underline"
      >
        {t("nextSectionCta", { section: t(`toc.${next}`) })}
      </a>
    );
  }

  // Tracks which section is currently at the top of the viewport, to
  // highlight it in the TOC and drive the small "you are here" pill —
  // re-runs when the set of rendered sections changes (worldCompare only
  // exists once its data has loaded).
  useEffect(() => {
    const elements = visibleSections
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActiveSection(topmost.target.id as SectionKey);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSections.length]);

  const snowReflectance = UV_REFLECTANCE.find((s) => s.key === "freshSnow")?.percent ?? 80;
  const latestOzoneArea = Math.round(OZONE_HOLE_AREA[OZONE_HOLE_AREA.length - 1].areaMillionKm2);

  // Reuses the same real constants cited later in their own articles
  // (UV_INCREASE_PERCENT_PER_1000M, UV_REFLECTANCE, OZONE_HOLE_AREA)
  // rather than re-typing the numbers here.
  const quickFactItems: {
    key: "cloudUv" | "spf" | "altitude" | "snow" | "ozone" | "iarc";
    values?: Record<string, number>;
  }[] = [
    { key: "cloudUv" },
    { key: "spf" },
    { key: "altitude", values: { percent: UV_INCREASE_PERCENT_PER_1000M } },
    { key: "snow", values: { percent: snowReflectance } },
    { key: "ozone", values: { area: latestOzoneArea } },
    { key: "iarc" },
  ];

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

      {/* "You are here" — only once there's an active section to report,
          i.e. once the reader has actually scrolled into content. Jumps
          back to the full TOC rather than duplicating its navigation. */}
      {activeSection && (
        <a
          href="#toc"
          className="fixed right-3 top-3 z-40 max-w-[65%] truncate rounded-full border border-border bg-bg/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm hover:text-brand-ink"
        >
          {t("readingLabel")}: {t(`toc.${activeSection}`)}
        </a>
      )}

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

      {/* Prominent and early on purpose — a page adding a quick-facts card
          and a glossary reads more "authoritative" than before, so the
          "this isn't medical advice" framing needs to land before any of
          that, not be buried at the bottom. Text is /privacy's own
          disclaimer, reused verbatim (see the note on tPrivacy above). */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm font-semibold text-foreground">
            {tPrivacy("disclaimer.notMedicalAdvice.title")}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {tPrivacy("disclaimer.notMedicalAdvice.body")}
        </p>
        <Link
          href="/privacy#disclaimer"
          className="mt-2 inline-block text-sm font-medium text-brand-ink hover:underline"
        >
          {t("disclaimer.linkLabel")}
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("quickFacts.title")}
        </p>
        <ul className="space-y-2.5">
          {quickFactItems.map(({ key, values }) => (
            <li key={key} className="flex gap-2.5 text-sm leading-relaxed text-ink">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
              <span>{t(`quickFacts.items.${key}`, values)}</span>
            </li>
          ))}
        </ul>
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
        id="toc"
        className="mb-12 scroll-mt-20 rounded-2xl border border-brand/15 bg-brand/[0.04] p-4"
        aria-label={t("toc.title")}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("toc.title")}
        </p>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {SECTION_KEYS.map((key) => (
            <li key={key}>
              <a
                href={`#${key}`}
                className={
                  key === activeSection
                    ? "text-sm font-semibold text-brand-ink"
                    : "text-sm text-ink hover:text-brand-ink hover:underline"
                }
              >
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
        {renderNextLink("methodology")}
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
        {renderNextLink("physics")}
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
        {renderNextLink("vitaminD")}
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
          {renderNextLink("worldCompare")}
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
        {renderNextLink("spf")}
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
        {renderNextLink("myths")}
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
        {renderNextLink("burnHeatmap")}
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
        {renderNextLink("airQuality")}
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
        {renderNextLink("ozone")}
      </article>

      <article id="iarc" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("iarc.title")} shareText={t("iarc.shareText")} anchor="iarc" />
        <p className="mb-6 text-ink leading-relaxed">{t("iarc.intro")}</p>
        <IarcTimeline milestones={IARC_TIMELINE} />
        {renderNextLink("iarc")}
      </article>

      <article id="glossary" className="mb-14 scroll-mt-20">
        <ArticleHeader title={t("glossary.title")} shareText={t("glossary.shareText")} anchor="glossary" />
        <p className="mb-5 text-ink leading-relaxed">{t("glossary.intro")}</p>
        <dl className="flex flex-col gap-3">
          {GLOSSARY_TERMS.map((key) => (
            <div key={key} className="rounded-xl border border-border bg-surface p-4">
              <dt className="text-sm font-semibold text-foreground">
                {t(`glossary.terms.${key}.term`)}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t(`glossary.terms.${key}.definition`)}
              </dd>
            </div>
          ))}
        </dl>
        {renderNextLink("glossary")}
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
            style={{ background: BRAND_MARK_GRADIENT }}
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
