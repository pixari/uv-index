"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getReapplyStartedAt,
  startReapplyTimer,
  clearReapplyTimer,
  minutesRemaining,
  getStoredSpf,
  setStoredSpf,
  SPF_OPTIONS,
  type Spf,
} from "@/lib/reapplyTimer";
import { burnMinutes, type SkinType } from "@/lib/skinType";

function spfLabel(spf: Spf) {
  return spf > 50 ? "50+" : String(spf);
}

const GLASS =
  "w-full max-w-xs rounded-3xl bg-white/12 shadow-lg ring-1 ring-white/15 backdrop-blur-xl";

const EYEBROW = "text-xs font-semibold uppercase tracking-wide text-white/60";

export default function ReapplyTimer({
  uv,
  profileId,
  skinType,
  onOpenSettings,
}: {
  uv: number;
  profileId: string;
  skinType: SkinType | null;
  onOpenSettings: () => void;
}) {
  const t = useTranslations("reapply");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [spf, setSpf] = useState<Spf | null>(null);
  const [pendingSpf, setPendingSpf] = useState<Spf>(30);

  useEffect(() => {
    setStartedAt(getReapplyStartedAt(profileId));
    setSpf(getStoredSpf(profileId));
  }, [profileId]);

  useEffect(() => {
    if (startedAt === null) {
      setRemaining(null);
      return;
    }
    function tick() {
      if (startedAt === null) return;
      setRemaining(minutesRemaining(startedAt));
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [startedAt]);

  function start() {
    startReapplyTimer(profileId);
    setStoredSpf(profileId, pendingSpf);
    setSpf(pendingSpf);
    setStartedAt(getReapplyStartedAt(profileId));
  }

  function reset() {
    clearReapplyTimer(profileId);
    setStartedAt(null);
  }

  // No skin type set yet — a discoverable prompt, not silent absence.
  if (!skinType) {
    return (
      <button
        onClick={onOpenSettings}
        className={`${GLASS} flex flex-col items-center gap-1.5 border border-dashed border-white/30 px-5 py-5 text-center transition-colors hover:bg-white/18`}
      >
        <span className="text-sm text-white/90">{t("setupPrompt")}</span>
        <span className="text-xs font-medium text-white">{t("setupCta")}</span>
      </button>
    );
  }

  // Active countdown running.
  if (startedAt !== null && remaining !== null) {
    const overdue = remaining <= 0;
    const h = Math.floor(Math.abs(remaining) / 60);
    const m = Math.abs(remaining) % 60;
    const timeLabel = h > 0 ? `${h}h ${m}min` : `${m}min`;

    return (
      <div className={`${GLASS} flex flex-col items-center gap-2 px-5 py-5 text-center`}>
        <span className={EYEBROW}>{t("title")}</span>
        <p className="text-lg font-medium text-white">
          {overdue ? t("overdue") : t("countdown", { time: timeLabel })}
        </p>
        {spf && (
          <p className="text-xs text-white/70">
            {t("spfInUse", { spf: spfLabel(spf) })}
          </p>
        )}
        <button
          onClick={overdue ? start : reset}
          className="mt-1 text-xs font-medium text-white/70 underline-offset-2 hover:text-white hover:underline"
        >
          {overdue ? t("reapplied") : t("cancel")}
        </button>
      </div>
    );
  }

  // Skin type set, no active timer — burn-time estimate, SPF choice, start.
  const burn = burnMinutes(skinType, uv);
  return (
    <div className={`${GLASS} flex w-full max-w-xs flex-col gap-4 px-5 py-5`}>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className={EYEBROW}>{t("title")}</span>
        {burn !== null && (
          <p className="text-sm text-white/85">
            {t("burnEstimate", { minutes: burn })}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-4">
        <span className="text-xs font-medium text-white/80">
          {t("spfLabel")}
        </span>
        <div className="flex gap-1.5">
          {SPF_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPendingSpf(option)}
              className={
                "flex h-8 w-11 items-center justify-center rounded-full text-xs font-semibold transition-colors " +
                (pendingSpf === option
                  ? "bg-white text-ink"
                  : "bg-white/15 text-white hover:bg-white/25")
              }
              aria-pressed={pendingSpf === option}
            >
              {spfLabel(option)}
            </button>
          ))}
        </div>
      </div>

      <Link
        href="/learn#spf"
        className="text-center text-[11px] leading-snug text-white/60 underline-offset-2 hover:text-white/85 hover:underline"
      >
        {t("spfNote")}
      </Link>

      <button
        onClick={start}
        className="rounded-full bg-white py-2.5 text-sm font-semibold text-ink transition-transform active:scale-[0.97]"
      >
        {t("start")}
      </button>
    </div>
  );
}
