"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { uvLevel, skyGradientCss } from "@/lib/uvLevel";
import {
  getProfiles,
  resolveActiveProfileId,
  setActiveProfileId,
  type Profile,
} from "@/lib/profiles";
import InstallPrompt from "./InstallPrompt";
import LocationSheet, { type Place } from "./LocationSheet";
import ReapplyTimer from "./ReapplyTimer";
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
  const [safeAfter, setSafeAfter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);

  // Restore last-used place, or fall back to GPS prompt.
  useEffect(() => {
    const saved = localStorage.getItem(LAST_PLACE_KEY);
    if (saved) {
      setCoords(JSON.parse(saved));
      return;
    }
    setShowLocation(true);
  }, []);

  // Load profiles (creating the default one on first run) and re-read
  // whenever Settings closes, since that's where profiles are managed.
  useEffect(() => {
    const list = getProfiles(t("defaultProfileName"));
    setProfiles(list);
    setActiveProfileIdState(resolveActiveProfileId(t("defaultProfileName")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsVersion]);

  function switchProfile(id: string) {
    setActiveProfileId(id);
    setActiveProfileIdState(id);
  }

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
          setSafeAfter(d.safeAfter ?? null);
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

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden transition-[background] duration-700 ease-out"
      style={{ background: skyGradientCss(level) }}
    >
      {/* App bar — transparent, blends into the sky */}
      <header className="flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <button
          onClick={() => setShowLocation(true)}
          className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white"
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
          className="rounded-full p-2 text-white/80 transition-colors hover:text-white"
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
      </header>

      <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 pb-8">
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
          {uv === null && !error && (
            <p className="text-white/70">{t("loading")}</p>
          )}
          {error && (
            <button
              onClick={useGps}
              className="text-white/70 underline underline-offset-4 hover:text-white transition-colors"
            >
              {t("locationPrompt")}
            </button>
          )}
          {uv !== null && level && (
            <div
              className="flex w-full flex-col items-center gap-7 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed
                  ? "translateY(0) scale(1)"
                  : "translateY(8px) scale(0.98)",
              }}
            >
              {/* Primary: thin, huge, white — the gradient carries the
                  color, the number doesn't need to. */}
              <div className="flex flex-col items-center gap-1 py-2">
                <p
                  className="font-sans font-thin leading-none tracking-[-0.03em] tabular-nums text-white"
                  style={{ fontSize: "clamp(6.5rem, 32vw, 12rem)" }}
                >
                  {Math.round(uv)}
                </p>
                <p className="text-2xl font-medium text-white">
                  {t(`riskLevels.${level}`)}
                </p>
              </div>

              <p className="max-w-[26ch] text-center text-white/85 text-lg font-medium leading-snug">
                {t(`actions.${level}`)}
              </p>

              {/* Secondary: today's forecast — frosted glass, not a white
                  card; depth comes from blur + translucency here. */}
              <div className="flex w-full max-w-xs flex-col gap-3 rounded-3xl bg-white/12 px-5 py-5 shadow-lg ring-1 ring-white/15 backdrop-blur-xl">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  {t("scaleLabel")}
                </span>
                <UvScaleBar uv={uv} />
                {safeAfter && (
                  <p className="text-center text-xs font-medium text-white/80">
                    {t("safeAfter", {
                      time: new Date(safeAfter).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    })}
                  </p>
                )}
              </div>

              {profiles.length > 1 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => switchProfile(p.id)}
                      className={
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                        (p.id === activeProfileId
                          ? "bg-white text-ink"
                          : "bg-white/15 text-white hover:bg-white/25")
                      }
                      aria-pressed={p.id === activeProfileId}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {activeProfileId && (
                <ReapplyTimer
                  key={activeProfileId}
                  uv={uv}
                  profileId={activeProfileId}
                  skinType={
                    profiles.find((p) => p.id === activeProfileId)?.skinType ?? null
                  }
                  onOpenSettings={() => setShowSettings(true)}
                />
              )}

              <div className="flex items-center gap-3 text-xs text-white/55">
                {updatedAt && (
                  <span>
                    {t("updated", {
                      time: new Date(updatedAt).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    })}
                  </span>
                )}
                <span aria-hidden>·</span>
                <ShareButton
                  uv={uv}
                  riskLabel={t(`riskLevels.${level}`)}
                  place={coords?.label ?? ""}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowScience(true)}
          className="mt-2 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-sm font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          {t("learnMore")}
        </button>
      </main>

      <LocationSheet
        open={showLocation}
        onOpenChange={setShowLocation}
        onUseGps={useGps}
        onSelect={selectPlace}
        currentPlace={coords}
      />
      <ScienceSheet open={showScience} onOpenChange={setShowScience} />
      <SettingsSheet
        open={showSettings}
        onOpenChange={(next) => {
          setShowSettings(next);
          if (!next) setSettingsVersion((v) => v + 1);
        }}
      />
      <InstallPrompt />
    </div>
  );
}
