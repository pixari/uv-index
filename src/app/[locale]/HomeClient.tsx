"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { uvLevel, UV_LEVEL_COLOR } from "@/lib/uvLevel";
import LocationSheet, { type Place } from "./LocationSheet";
import ScienceSheet from "./ScienceSheet";

type Coords = { lat: number; lon: number; label: string };

const LAST_PLACE_KEY = "uv-index:last-place";

export default function HomeClient() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [uv, setUv] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [showScience, setShowScience] = useState(false);

  // Restore last-used place, or fall back to GPS prompt.
  useEffect(() => {
    const saved = localStorage.getItem(LAST_PLACE_KEY);
    if (saved) {
      setCoords(JSON.parse(saved));
      return;
    }
    setShowLocation(true);
  }, []);

  // Persist on every change, including a label resolved after the fact.
  useEffect(() => {
    if (!coords) return;
    localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(coords));
  }, [coords]);

  // Refetch UV only when the actual coordinates change, not when a
  // reverse-geocoded label arrives later for the same point.
  useEffect(() => {
    if (!coords) return;
    setUv(null);
    setError(null);
    fetch(`/api/uv?lat=${coords.lat}&lon=${coords.lon}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.uv === "number") setUv(d.uv);
        else setError("no-data");
      })
      .catch(() => setError("fetch-failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lon]);

  function useGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setCoords({ lat, lon, label: t("currentLocation") });
        setShowLocation(false);

        // Resolve a human-readable place name in the background; the
        // GPS-only label above is already a valid state on its own.
        fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}&lang=${locale}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.name) {
              setCoords((prev) =>
                prev && prev.lat === lat && prev.lon === lon
                  ? { ...prev, label: d.name }
                  : prev,
              );
            }
          })
          .catch(() => {});
      },
      () => setShowLocation(true),
    );
  }

  function selectPlace(p: Place) {
    setCoords({ lat: p.lat, lon: p.lon, label: p.name });
    setShowLocation(false);
  }

  const level = uv !== null ? uvLevel(uv) : null;
  const color = level ? UV_LEVEL_COLOR[level] : "#333";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between px-6 py-10">
      <button
        onClick={() => setShowLocation(true)}
        className="text-sm text-zinc-400 underline underline-offset-4"
      >
        {coords?.label ?? t("locationPrompt")}
      </button>

      <div className="flex flex-col items-center gap-4">
        {uv === null && !error && (
          <p className="text-zinc-400">{t("loading")}</p>
        )}
        {error && (
          <button
            onClick={useGps}
            className="text-zinc-400 underline underline-offset-4"
          >
            {t("locationPrompt")}
          </button>
        )}
        {uv !== null && level && (
          <>
            <div
              className="flex h-56 w-56 items-center justify-center rounded-full text-8xl font-bold text-black"
              style={{ backgroundColor: color }}
            >
              {Math.round(uv)}
            </div>
            <p className="text-2xl font-medium" style={{ color }}>
              {t(`riskLevels.${level}`)}
            </p>
            <p className="max-w-xs text-center text-zinc-300">
              {t(`actions.${level}`)}
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => setShowScience(true)}
        className="rounded-full border border-zinc-700 px-6 py-2 text-sm text-zinc-300"
      >
        {t("learnMore")}
      </button>

      {showLocation && (
        <LocationSheet
          onClose={() => setShowLocation(false)}
          onUseGps={useGps}
          onSelect={selectPlace}
        />
      )}
      {showScience && <ScienceSheet onClose={() => setShowScience(false)} />}
    </main>
  );
}
