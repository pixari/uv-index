"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { uvLevel, skyGradientCss } from "@/lib/uvLevel";
import {
  getProfiles,
  resolveActiveProfileId,
  setActiveProfileId,
  type Profile,
} from "@/lib/profiles";
import { consumeSettingsReopen } from "@/lib/pendingSettingsReopen";
import {
  HIGH_UV_THRESHOLD,
  getHighUvNotifPref,
  showNotification,
} from "@/lib/notifications";
import { getCachedUv, setCachedUv } from "@/lib/uvCache";
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
  const tn = useTranslations("notify");
  const locale = useLocale();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [uv, setUv] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [safeAfter, setSafeAfter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  // Tracks the last UV value we've considered for the high-UV alert, so a
  // notification fires on the rise past the threshold, not on every poll
  // while it stays high.
  const lastNotifiedUvRef = useRef<number | null>(null);
  // Guards against out-of-order responses: coordinate changes, the
  // visibility/focus refresh, and the periodic poll can all have requests
  // in flight at once, and a slow older one resolving after a newer one
  // must not clobber it with stale data.
  const fetchSeqRef = useRef(0);

  // Restore last-used place, or fall back to GPS prompt.
  useEffect(() => {
    const saved = localStorage.getItem(LAST_PLACE_KEY);
    if (saved) {
      setCoords(JSON.parse(saved));
      return;
    }
    setShowLocation(true);
  }, []);

  // Settings was open right before a language switch remounted this page —
  // reopen it so the panel doesn't just appear to have closed on its own.
  useEffect(() => {
    if (consumeSettingsReopen()) setShowSettings(true);
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

  function maybeNotifyHighUv(value: number) {
    const prev = lastNotifiedUvRef.current;
    lastNotifiedUvRef.current = value;
    if (!getHighUvNotifPref()) return;
    if (value >= HIGH_UV_THRESHOLD && (prev === null || prev < HIGH_UV_THRESHOLD)) {
      showNotification(tn("highUvTitle"), tn("highUvBody", { uv: Math.round(value) }));
    }
  }

  // Falls back to the last cached reading for this place (if any) instead
  // of a blank error — a stale-but-real number beats nothing when offline
  // or the upstream source is down.
  function useCacheOrError(lat: number, lon: number, opts?: { silent?: boolean }) {
    const cached = getCachedUv(lat, lon);
    if (cached) {
      setUv(cached.uv);
      setUpdatedAt(cached.updatedAt);
      setSafeAfter(cached.safeAfter);
      setError(null);
      setStale(true);
      if (opts?.silent) setRevealed(true);
      else requestAnimationFrame(() => setRevealed(true));
    } else if (!opts?.silent) {
      setError("fetch-failed");
    }
    // A silent refresh with nothing cached leaves whatever's already on
    // screen alone rather than clearing a working reading over one failed
    // background refresh.
  }

  // `silent` skips the loading/reveal reset — used for background refreshes
  // so an already-visible number doesn't flash away while the new one loads.
  function fetchUv(lat: number, lon: number, opts?: { silent?: boolean }) {
    const seq = ++fetchSeqRef.current;
    if (!opts?.silent) {
      setUv(null);
      setError(null);
      setStale(false);
      setRevealed(false);
    }
    fetch(`/api/uv?lat=${lat}&lon=${lon}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (seq !== fetchSeqRef.current) return; // a newer request has since started
        if (typeof d.uv === "number") {
          setUv(d.uv);
          setUpdatedAt(d.updatedAt ?? null);
          setSafeAfter(d.safeAfter ?? null);
          setError(null);
          setStale(false);
          setCachedUv({
            lat,
            lon,
            uv: d.uv,
            updatedAt: d.updatedAt ?? null,
            safeAfter: d.safeAfter ?? null,
            fetchedAt: Date.now(),
          });
          maybeNotifyHighUv(d.uv);
          if (opts?.silent) setRevealed(true);
          else requestAnimationFrame(() => setRevealed(true));
        } else {
          useCacheOrError(lat, lon, opts);
        }
      })
      .catch(() => {
        if (seq !== fetchSeqRef.current) return;
        useCacheOrError(lat, lon, opts);
      });
  }

  // Refetch UV only when the actual coordinates change, not when a
  // reverse-geocoded label arrives later for the same point.
  useEffect(() => {
    if (!coords) return;
    fetchUv(coords.lat, coords.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lon]);

  // Reopening the app (or switching back to its tab) should never show a
  // stale reading — refresh immediately whenever it becomes visible again.
  useEffect(() => {
    if (!coords) return;
    function onVisible() {
      if (document.visibilityState === "visible" && coords) {
        fetchUv(coords.lat, coords.lon, { silent: true });
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lon]);

  // Also poll periodically while the app stays open — otherwise a long
  // session (e.g. sitting outside all afternoon) would only ever notice a
  // rise above the high-UV threshold at the moment it was opened.
  useEffect(() => {
    if (!coords) return;
    const id = setInterval(
      () => fetchUv(coords.lat, coords.lon, { silent: true }),
      15 * 60 * 1000,
    );
    return () => clearInterval(id);
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
                  profileName={
                    profiles.find((p) => p.id === activeProfileId)?.name ?? ""
                  }
                  skinType={
                    profiles.find((p) => p.id === activeProfileId)?.skinType ?? null
                  }
                  onOpenSettings={() => setShowSettings(true)}
                />
              )}

              <div className="flex items-center gap-3 text-xs text-white/55">
                {stale && (
                  <>
                    <span className="font-medium text-white/70">
                      {t("offlineNotice")}
                    </span>
                    <span aria-hidden>·</span>
                  </>
                )}
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
