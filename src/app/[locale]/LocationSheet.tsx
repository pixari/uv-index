"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export type Place = {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  lat: number;
  lon: number;
};

export default function LocationSheet({
  onClose,
  onUseGps,
  onSelect,
}: {
  onClose: () => void;
  onUseGps: () => void;
  onSelect: (p: Place) => void;
}) {
  const t = useTranslations("location");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
  }, []);

  function close() {
    setOpen(false);
    setTimeout(onClose, 300);
  }

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(q)}&lang=${locale}`,
    );
    const data = await res.json();
    setResults(data.results ?? []);
    setSearching(false);
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

        <button
          onClick={onUseGps}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {t("useGps")}
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={t("search")}
          className="mb-2 w-full rounded-xl border border-black/10 bg-surface px-4 py-3 text-ink placeholder:text-muted outline-none focus:border-brand"
        />

        {searching && <p className="text-sm text-muted">...</p>}

        <ul className="max-h-64 overflow-y-auto">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p)}
                className="w-full rounded-lg px-2 py-3 text-left text-ink hover:bg-surface transition-colors"
              >
                {p.name}
                {p.admin1 ? `, ${p.admin1}` : ""} — {p.country}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
