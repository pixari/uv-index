"use client";

import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/60">
      <div className="w-full rounded-t-2xl bg-zinc-900 p-6 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <button onClick={onClose} className="text-zinc-400">
            ✕
          </button>
        </div>

        <button
          onClick={onUseGps}
          className="mb-4 w-full rounded-xl bg-white py-3 font-medium text-black"
        >
          📍 {t("useGps")}
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={t("search")}
          className="mb-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none"
        />

        {searching && <p className="text-sm text-zinc-500">...</p>}

        <ul className="max-h-64 overflow-y-auto">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p)}
                className="w-full rounded-lg px-2 py-3 text-left hover:bg-zinc-800"
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
