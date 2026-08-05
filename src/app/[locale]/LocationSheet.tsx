"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type Place = {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  lat: number;
  lon: number;
};

export default function LocationSheet({
  open,
  onOpenChange,
  onUseGps,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
          />

          {searching && <p className="text-sm text-muted-foreground">...</p>}

          <ul className="max-h-64 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p)}
                  className="w-full rounded-lg px-2 py-3 text-left text-foreground hover:bg-surface transition-colors"
                >
                  {p.name}
                  {p.admin1 ? `, ${p.admin1}` : ""} — {p.country}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
