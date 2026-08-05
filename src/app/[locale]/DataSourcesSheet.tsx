"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const SOURCES = [
  {
    name: "MET Norway",
    url: "https://api.met.no/weatherapi/locationforecast/2.0/documentation",
    key: "met",
  },
  {
    name: "Open-Meteo",
    url: "https://open-meteo.com/en/docs/geocoding-api",
    key: "openMeteo",
  },
  {
    name: "BigDataCloud",
    url: "https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocode-to-city-api",
    key: "bigDataCloud",
  },
];

export default function DataSourcesSheet({
  onClose,
}: {
  onClose: () => void;
}) {
  const t = useTranslations("dataSources");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
  }, []);

  function close() {
    setOpen(false);
    setTimeout(onClose, 300);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ backgroundColor: open ? "rgb(0 0 0 / 0.3)" : "rgb(0 0 0 / 0)" }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-bg p-6 pb-10 shadow-[0_-8px_30px_rgb(0_0_0_/_0.12)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl">{t("title")}</h2>
          <button
            onClick={close}
            className="text-muted hover:text-ink transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mb-6 text-ink leading-relaxed">{t("locationNote")}</p>

        <h3 className="mb-2 text-sm font-medium text-muted">
          {t("sources")}
        </h3>
        <ul className="mb-6 space-y-3">
          {SOURCES.map((s) => (
            <li key={s.key}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-black/10 px-4 py-3 hover:bg-surface transition-colors"
              >
                <span className="block text-sm font-medium text-ink">
                  {s.name}
                </span>
                <span className="block text-sm text-muted">
                  {t(`uses.${s.key}`)}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted leading-relaxed">
          {t("analyticsNote")}
        </p>
      </div>
    </div>
  );
}
