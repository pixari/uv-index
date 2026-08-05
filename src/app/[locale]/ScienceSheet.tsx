"use client";

import { useTranslations } from "next-intl";

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

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60">
      <div className="w-full rounded-t-2xl bg-zinc-900 p-6 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <button onClick={onClose} className="text-zinc-400">
            ✕
          </button>
        </div>

        <p className="mb-6 text-zinc-300">{t("intro")}</p>

        <h3 className="mb-2 text-sm font-medium text-zinc-500">
          {t("sources")}
        </h3>
        <ul className="space-y-3">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-zinc-800 px-4 py-3 hover:bg-zinc-800"
              >
                <span className="block text-sm font-medium">{s.name}</span>
                <span className="block text-sm text-zinc-400">
                  {s.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
