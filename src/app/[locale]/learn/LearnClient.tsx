"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { findLowRiskWindows } from "@/lib/bestWindow";
import UvDayChart from "./UvDayChart";

const LAST_PLACE_KEY = "uv-index:last-place";

type Coords = { lat: number; lon: number; label: string };
type Point = { time: string; uv: number };

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LearnClient() {
  const t = useTranslations("learn");
  const locale = useLocale();
  const [points, setPoints] = useState<Point[] | null>(null);
  const [place, setPlace] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LAST_PLACE_KEY);
    if (!saved) return;
    const coords: Coords = JSON.parse(saved);
    setPlace(coords.label);
    fetch(`/api/uv-timeseries?lat=${coords.lat}&lon=${coords.lon}`)
      .then((r) => r.json())
      .then((d) => setPoints(d.today ?? []))
      .catch(() => setPoints([]));
  }, []);

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground hover:text-brand-ink transition-colors"
      >
        {t("back")}
      </Link>

      <h1 className="font-display text-4xl leading-tight mb-8">
        {t("title")}
      </h1>

      {points && points.length > 1 && (
        <section className="mb-12">
          <h2 className="font-display text-xl mb-1">
            {t("chart.title")}
          </h2>
          {place && (
            <p className="mb-4 text-sm text-muted-foreground">
              {t("chart.subtitle", { place })}
            </p>
          )}
          <UvDayChart points={points} />

          {(() => {
            const windows = findLowRiskWindows(points);
            return (
              <div className="mt-4 rounded-xl bg-surface px-4 py-3">
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

      <article className="mb-14">
        <h2 className="font-display text-2xl mb-4">{t("methodology.title")}</h2>
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

      <article id="spf" className="mb-14 scroll-mt-20">
        <h2 className="font-display text-2xl mb-4">{t("spf.title")}</h2>
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
    </main>
  );
}
