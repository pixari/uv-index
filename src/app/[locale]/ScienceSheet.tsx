"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const SOURCES = [
  {
    name: "WHO / WMO / UNEP / ICNIRP",
    title: "Global Solar UV Index: A Practical Guide",
    url: "https://www.who.int/publications/i/item/9241590076",
  },
  {
    name: "IARC (WHO)",
    title: "Solar and ultraviolet radiation — Group 1 carcinogen",
    url: "https://publications.iarc.fr/Book-And-Report-Series/Iarc-Monographs-On-The-Identification-Of-Carcinogenic-Hazards-To-Humans/Solar-And-Ultraviolet-Radiation-1997",
  },
  {
    name: "American Academy of Dermatology",
    title: "Sunscreen FAQs",
    url: "https://www.aad.org/media/stats-sunscreen",
  },
  {
    name: "Skin Cancer Foundation",
    title: "Skin cancer facts & statistics",
    url: "https://www.skincancer.org/skin-cancer-information/skin-cancer-facts/",
  },
];

export default function ScienceSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("science");
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

        <p className="mb-6 text-ink leading-relaxed">{t("intro")}</p>

        <h3 className="mb-2 text-sm font-medium text-muted">
          {t("sources")}
        </h3>
        <ul className="space-y-3">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-black/10 px-4 py-3 hover:bg-surface transition-colors"
              >
                <span className="block text-sm font-medium text-ink">
                  {s.name}
                </span>
                <span className="block text-sm text-muted">{s.title}</span>
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/learn"
          className="mt-6 block text-sm text-brand-ink underline-offset-4 hover:underline"
        >
          {t("learnMoreLink")}
        </Link>
      </div>
    </div>
  );
}
