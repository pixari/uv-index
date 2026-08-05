"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { uvLevel, RISK_TEXT_COLOR } from "@/lib/uvLevel";
import InstallPrompt from "./InstallPrompt";
import LocationSheet, { type Place } from "./LocationSheet";
import ScienceSheet from "./ScienceSheet";
import SettingsSheet from "./SettingsSheet";
import ShareButton from "./ShareButton";
import UvScaleBar from "./UvScaleBar";

type Coords = { lat: number; lon: number; label: string };

const LAST_PLACE_KEY = "uv-index:last-place";

export default function HomeClient() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [uv, setUv] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [revealed, setRevealed] = useState(false);

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
    setRevealed(false);
    fetch(`/api/uv?lat=${coords.lat}&lon=${coords.lon}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.uv === "number") {
          setUv(d.uv);
          setUpdatedAt(d.updatedAt ?? null);
          requestAnimationFrame(() => setRevealed(true));
        } else {
          setError("no-data");
        }
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
  const color = level ? RISK_TEXT_COLOR[level] : "var(--ink)";

  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-8">
      <div className="flex w-full max-w-xs items-center justify-between">
        <button
          onClick={() => setShowLocation(true)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-brand-ink transition-colors"
        >
          <svg
            width="14"
            height="14"
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
          {coords?.label ?? t("locationPrompt")}
        </button>

        <button
          onClick={() => setShowSettings(true)}
          aria-label={t("settingsLabel")}
          className="text-muted hover:text-brand-ink transition-colors"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10">
        {uv === null && !error && (
          <p className="text-muted">{t("loading")}</p>
        )}
        {error && (
          <button
            onClick={useGps}
            className="text-muted underline underline-offset-4 hover:text-brand-ink transition-colors"
          >
            {t("locationPrompt")}
          </button>
        )}
        {uv !== null && level && (
          <div
            className="flex flex-col items-center gap-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
            }}
          >
            <p
              className="font-display font-medium leading-none tracking-[-0.04em] tabular-nums"
              style={{
                color,
                fontSize: "clamp(7rem, 34vw, 13rem)",
              }}
            >
              {Math.round(uv)}
            </p>
            <p
              className="font-display text-4xl italic -mt-3"
              style={{ color }}
            >
              {t(`riskLevels.${level}`)}
            </p>
            <p className="max-w-[26ch] text-center text-ink text-lg leading-snug">
              {t(`actions.${level}`)}
            </p>
            <UvScaleBar uv={uv} />
            {updatedAt && (
              <p className="text-xs text-muted">
                {t("updated", {
                  time: new Date(updatedAt).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </p>
            )}
            <ShareButton
              uv={uv}
              riskLabel={t(`riskLevels.${level}`)}
              place={coords?.label ?? ""}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => setShowScience(true)}
        className="text-sm text-brand-ink underline-offset-4 hover:underline"
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
      {showSettings && (
        <SettingsSheet onClose={() => setShowSettings(false)} />
      )}
      <InstallPrompt />
    </main>
  );
}
