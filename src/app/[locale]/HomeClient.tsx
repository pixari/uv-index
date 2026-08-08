"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { uvLevel, skyGradientCss } from "@/lib/uvLevel";
import { cloudCoverLevel } from "@/lib/cloudCover";
import { aqiLevel } from "@/lib/airQuality";
import {
  getProfiles,
  resolveActiveProfileId,
  setActiveProfileId,
  type Profile,
} from "@/lib/profiles";
import { consumeSettingsReopen } from "@/lib/pendingSettingsReopen";
import { getHighUvNotifPref, showNotification } from "@/lib/notifications";
import { crossedHighUvThreshold } from "@/lib/uvThreshold";
import { isPushSubscribedLocally, subscribeToHighUvPush } from "@/lib/pushClient";
import { getCachedUv, setCachedUv } from "@/lib/uvCache";
import { reapplyStatus, type ReapplyStatus } from "@/lib/reapplyTimer";
import { setAppBadgeCount } from "@/lib/appBadge";
import { getLastPlace, setLastPlace, type LastPlace } from "@/lib/lastPlace";
import { Link } from "@/i18n/navigation";
import ForecastSheet from "./ForecastSheet";
import InstallPrompt from "./InstallPrompt";
import LocationSheet, { type Place } from "./LocationSheet";
import ReapplyTimer from "./ReapplyTimer";
import SettingsSheet from "./SettingsSheet";
import ShareButton from "./ShareButton";
import UvScaleBar from "./UvScaleBar";
import { GLASS_CARD } from "./glassCard";

export default function HomeClient() {
  const t = useTranslations("home");
  const tn = useTranslations("notify");
  const locale = useLocale();
  const [coords, setCoords] = useState<LastPlace | null>(null);
  const [uv, setUv] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [safeAfter, setSafeAfter] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [cloudCover, setCloudCover] = useState<number | null>(null);
  const [aqi, setAqi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  // Every profile's reapply status, not just the active one's — powers the
  // at-a-glance dot on each switcher chip and the app icon badge, both of
  // which need to know about people who aren't currently selected.
  const [profileStatuses, setProfileStatuses] = useState<Record<string, ReapplyStatus>>({});
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
    const saved = getLastPlace();
    if (saved) {
      setCoords(saved);
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

  // Recompute every profile's reapply status on the same 30s cadence the
  // active timer itself ticks on, so the chip dots and the app badge stay
  // live without needing to mount every profile's ReapplyTimer at once.
  useEffect(() => {
    function recompute() {
      const next: Record<string, ReapplyStatus> = {};
      for (const p of profiles) next[p.id] = reapplyStatus(p.id);
      setProfileStatuses(next);
    }
    recompute();
    const id = setInterval(recompute, 30_000);
    return () => clearInterval(id);
  }, [profiles]);

  // App icon badge — count of people currently overdue, visible even with
  // the app closed (where supported; a no-op elsewhere).
  useEffect(() => {
    const overdueCount = Object.values(profileStatuses).filter((s) => s === "overdue").length;
    setAppBadgeCount(overdueCount);
  }, [profileStatuses]);

  // Persist on every change, including a label resolved after the fact.
  useEffect(() => {
    if (!coords) return;
    setLastPlace(coords);
  }, [coords]);

  function maybeNotifyHighUv(value: number) {
    const prev = lastNotifiedUvRef.current;
    lastNotifiedUvRef.current = value;
    if (!getHighUvNotifPref()) return;
    if (crossedHighUvThreshold(prev, value)) {
      showNotification(tn("highUvTitle"), tn("highUvBody", { uv: Math.round(value) }));
    }
  }

  // Falls back to the last cached reading for this place (if any) instead
  // of a blank error — a stale-but-real number beats nothing when offline
  // or the upstream source is down.
  function applyCachedOrError(lat: number, lon: number, opts?: { silent?: boolean }) {
    const cached = getCachedUv(lat, lon);
    if (cached) {
      setUv(cached.uv);
      // The time *this device* last actually fetched it, not MET's own
      // "updatedAt" (see the note in fetchUv) — same reasoning, cached.
      setUpdatedAt(new Date(cached.fetchedAt).toISOString());
      setSafeAfter(cached.safeAfter);
      setTemperature(cached.temperature ?? null);
      setCloudCover(cached.cloudCover ?? null);
      setAqi(cached.aqi ?? null);
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
          const fetchedAt = Date.now();
          setUv(d.uv);
          // Deliberately *not* d.updatedAt: that's MET's own model-run
          // timestamp, which only changes when MET regenerates their
          // forecast product — often hours apart — not on every refetch.
          // Showing it as "Updated at" made the app look stuck even while
          // it was successfully refreshing. This is when *this device*
          // last actually confirmed the reading, which is what the label
          // means to the person reading it.
          setUpdatedAt(new Date(fetchedAt).toISOString());
          setSafeAfter(d.safeAfter ?? null);
          setTemperature(typeof d.temperature === "number" ? d.temperature : null);
          setCloudCover(typeof d.cloudCover === "number" ? d.cloudCover : null);
          setAqi(typeof d.aqi === "number" ? d.aqi : null);
          setError(null);
          setStale(false);
          setCachedUv({
            lat,
            lon,
            uv: d.uv,
            updatedAt: d.updatedAt ?? null,
            safeAfter: d.safeAfter ?? null,
            fetchedAt,
            temperature: typeof d.temperature === "number" ? d.temperature : null,
            cloudCover: typeof d.cloudCover === "number" ? d.cloudCover : null,
            aqi: typeof d.aqi === "number" ? d.aqi : null,
          });
          maybeNotifyHighUv(d.uv);
          if (opts?.silent) setRevealed(true);
          else requestAnimationFrame(() => setRevealed(true));
        } else {
          applyCachedOrError(lat, lon, opts);
        }
      })
      .catch(() => {
        if (seq !== fetchSeqRef.current) return;
        applyCachedOrError(lat, lon, opts);
      });
  }

  // Refetch UV only when the actual coordinates change, not when a
  // reverse-geocoded label arrives later for the same point.
  useEffect(() => {
    if (!coords) return;
    fetchUv(coords.lat, coords.lon);
    // Keep an existing push subscription pointed at wherever the person
    // actually is now — without this, switching places would leave a
    // background alert silently watching the old one. No-ops if push
    // was never turned on (isPushSubscribedLocally() reads a plain
    // localStorage flag, no network round-trip either way).
    if (isPushSubscribedLocally()) {
      subscribeToHighUvPush(coords, locale);
    }
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

  function requestGpsLocation() {
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

  // Entry point for the PWA's app shortcuts (manifest.ts) — a long-press
  // on the installed icon can only link to a static URL, not a specific
  // saved place (those live in this browser's localStorage, which the
  // manifest route has no access to), so the shortcuts jump here instead
  // and trigger the same actions their labels promise.
  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get("action");
    if (action === "gps") requestGpsLocation();
    else if (action === "location") setShowLocation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {/* `error` only ever gets set once coords already exist (see
              fetchUv's call sites) — the problem is never "no location",
              so retry the same fetch instead of re-prompting for GPS. */}
          {error && coords && (
            <button
              onClick={() => fetchUv(coords.lat, coords.lon)}
              className="text-white/70 underline underline-offset-4 hover:text-white transition-colors"
            >
              {t("fetchErrorRetry")}
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
                {/* Same MET instant the UV reading itself comes from — no
                    extra request, just fields the app used to ignore.
                    Quiet/secondary on purpose: DESIGN.md reserves color
                    for the WHO risk signal, this is just context. */}
                {(temperature !== null || cloudCover !== null || aqi !== null) && (
                  <p className="text-sm font-medium text-white/60">
                    {[
                      temperature !== null
                        ? t("weather.temperature", { temp: Math.round(temperature) })
                        : null,
                      cloudCover !== null
                        ? t(`weather.cloud.${cloudCoverLevel(cloudCover)}`)
                        : null,
                      aqi !== null ? t(`weather.aqi.${aqiLevel(aqi)}`) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>

              <p className="max-w-[26ch] text-center text-white/85 text-lg font-medium leading-snug">
                {t(`actions.${level}`)}
              </p>

              {/* Secondary: today's forecast — frosted glass, not a white
                  card; depth comes from blur + translucency here. Tappable:
                  opens the richer forecast panel (chart, upcoming days,
                  vitamin D window) rather than crowding those onto this
                  single-glance screen. */}
              <button
                onClick={() => setShowForecast(true)}
                aria-label={t("openForecastLabel")}
                className={`flex w-full max-w-xs flex-col gap-3 px-5 py-5 text-left transition-colors hover:bg-white/16 ${GLASS_CARD}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {t("scaleLabel")}
                  </span>
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/50"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
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
              </button>

              {profiles.length > 1 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {profiles.map((p) => {
                    const status = profileStatuses[p.id] ?? "none";
                    return (
                      <button
                        key={p.id}
                        onClick={() => switchProfile(p.id)}
                        className={
                          "relative rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                          (p.id === activeProfileId
                            ? "bg-white text-ink"
                            : "bg-white/15 text-white hover:bg-white/25")
                        }
                        aria-pressed={p.id === activeProfileId}
                        title={
                          status === "overdue"
                            ? t("statusOverdue", { name: p.name })
                            : status === "ok"
                              ? t("statusOk", { name: p.name })
                              : undefined
                        }
                      >
                        {p.name}
                        {/* Shape carries the signal too, not just color —
                            an "!" glyph on overdue — so this isn't a
                            hue-only cue. */}
                        {status !== "none" && (
                          <span
                            aria-hidden
                            className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold leading-none text-white ring-2 ring-black/10"
                            style={{
                              backgroundColor:
                                status === "overdue" ? "var(--risk-very-high)" : "var(--risk-low)",
                            }}
                          >
                            {status === "overdue" ? "!" : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
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
                  isInfant={
                    profiles.find((p) => p.id === activeProfileId)?.isInfant ?? false
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

        {/* A real, bounded footer rather than a stray line of text — but
            scaled for a single-viewport glanceable screen, not a long page:
            no brand mark (Home itself already is the brand moment) and no
            back-to-top (nothing here scrolls). The divider reuses the same
            hairline pattern already used inside ReapplyTimer's SPF picker,
            not a new one-off. Straight to the (now much richer) /learn page
            — a person already has to leave Home to read it, so a single
            direct tap beats detouring through an intermediate sheet first;
            the quick "why trust this" sources list that used to live behind
            this link now lives in Settings, alongside the other "more info"
            links, rather than gatekeeping the primary destination. */}
        <footer className="mt-2 flex shrink-0 justify-center border-t border-white/10 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Link
            href="/learn"
            className="text-sm font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
          >
            {t("learnMore")}
          </Link>
        </footer>
      </main>

      <LocationSheet
        open={showLocation}
        onOpenChange={setShowLocation}
        onUseGps={requestGpsLocation}
        onSelect={selectPlace}
        currentPlace={coords}
      />
      <SettingsSheet
        open={showSettings}
        onOpenChange={(next) => {
          setShowSettings(next);
          if (!next) setSettingsVersion((v) => v + 1);
        }}
      />
      <ForecastSheet
        open={showForecast}
        onOpenChange={setShowForecast}
        coords={coords}
        uv={uv}
        skinType={profiles.find((p) => p.id === activeProfileId)?.skinType ?? null}
      />
      <InstallPrompt />
    </div>
  );
}
