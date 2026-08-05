"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getSavedPlaces,
  savePlace,
  removeSavedPlace,
  isSaved,
  samePlaceId,
  type SavedPlace,
} from "@/lib/savedPlaces";

export type Place = {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  lat: number;
  lon: number;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function LocationSheet({
  open,
  onOpenChange,
  onUseGps,
  onSelect,
  currentPlace,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseGps: () => void;
  onSelect: (p: Place) => void;
  currentPlace?: { lat: number; lon: number; label: string } | null;
}) {
  const t = useTranslations("location");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [saved, setSaved] = useState<SavedPlace[]>([]);

  useEffect(() => {
    if (open) setSaved(getSavedPlaces());
  }, [open]);

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

  function toggleSaved(place: { label: string; lat: number; lon: number }) {
    if (isSaved(place.lat, place.lon)) {
      const id = saved.find((p) => samePlaceId(place.lat, place.lon, p.id))?.id;
      if (id) removeSavedPlace(id);
    } else {
      savePlace(place);
    }
    setSaved(getSavedPlaces());
  }

  function selectSaved(p: SavedPlace) {
    onSelect({ id: 0, name: p.label, country: "", admin1: null, lat: p.lat, lon: p.lon });
  }

  const currentIsSaved =
    currentPlace != null && isSaved(currentPlace.lat, currentPlace.lon);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">
            {t("title")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <Button onClick={onUseGps} className="w-full gap-2" size="lg">
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
          </Button>

          {currentPlace && !currentIsSaved && (
            <button
              onClick={() => toggleSaved(currentPlace)}
              className="flex items-center justify-center gap-2 text-sm text-brand-ink"
            >
              <StarIcon filled={false} />
              {t("saveCurrent", { place: currentPlace.label })}
            </button>
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
          />

          {searching && <p className="text-sm text-muted-foreground">...</p>}

          {!query && saved.length > 0 && (
            <div>
              <h3 className="mb-1 px-2 text-sm font-medium text-muted-foreground">
                {t("saved")}
              </h3>
              <ul>
                {saved.map((p) => (
                  <li key={p.id} className="flex items-center gap-1">
                    <button
                      onClick={() => selectSaved(p)}
                      className="flex-1 rounded-lg px-2 py-3 text-left text-foreground hover:bg-surface transition-colors"
                    >
                      {p.label}
                    </button>
                    <button
                      onClick={() => {
                        removeSavedPlace(p.id);
                        setSaved(getSavedPlaces());
                      }}
                      aria-label={t("removeSaved")}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="max-h-64 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                <button
                  onClick={() => onSelect(p)}
                  className="flex-1 rounded-lg px-2 py-3 text-left text-foreground hover:bg-surface transition-colors"
                >
                  {p.name}
                  {p.admin1 ? `, ${p.admin1}` : ""} — {p.country}
                </button>
                <button
                  onClick={() =>
                    toggleSaved({ label: p.name, lat: p.lat, lon: p.lon })
                  }
                  aria-label={t("toggleSaved")}
                  className={
                    isSaved(p.lat, p.lon)
                      ? "p-2 text-brand-ink"
                      : "p-2 text-muted-foreground hover:text-brand-ink transition-colors"
                  }
                >
                  <StarIcon filled={isSaved(p.lat, p.lon)} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
