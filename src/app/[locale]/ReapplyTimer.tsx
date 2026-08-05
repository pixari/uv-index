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
import { getStoredSkinType, burnMinutes, type SkinType } from "@/lib/skinType";

function spfLabel(spf: Spf) {
  return spf > 50 ? "50+" : String(spf);
}

const GLASS =
  "w-full max-w-xs rounded-3xl bg-white/12 shadow-lg ring-1 ring-white/15 backdrop-blur-xl";

export default function ReapplyTimer({
  uv,
  onOpenSettings,
}: {
  uv: number;
  onOpenSettings: () => void;
}) {
  const t = useTranslations("reapply");
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [spf, setSpf] = useState<Spf | null>(null);
  const [pendingSpf, setPendingSpf] = useState<Spf>(30);

  useEffect(() => {
    setSkinType(getStoredSkinType());
    setStartedAt(getReapplyStartedAt());
    setSpf(getStoredSpf());
  }, []);

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
    startReapplyTimer();
    setStoredSpf(pendingSpf);
    setSpf(pendingSpf);
    setStartedAt(getReapplyStartedAt());
  }

  function reset() {
    clearReapplyTimer();
    setStartedAt(null);
  }

  // No skin type set yet — a discoverable prompt, not silent absence.
  if (!skinType) {
    return (
      <button
        onClick={onOpenSettings}
        className={`${GLASS} flex flex-col items-center gap-1 border border-dashed border-white/30 px-4 py-3.5 text-center transition-colors hover:bg-white/18`}
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
      <div className={`${GLASS} flex flex-col items-center gap-1.5 px-4 py-3.5 text-center`}>
        <p className="text-sm font-medium text-white">
          {overdue ? t("overdue") : t("countdown", { time: timeLabel })}
        </p>
        {spf && (
          <p className="text-xs text-white/70">
            {t("spfInUse", { spf: spfLabel(spf) })}
          </p>
        )}
        <button
          onClick={overdue ? start : reset}
          className="text-xs font-medium text-white/70 underline-offset-2 hover:text-white hover:underline"
        >
          {overdue ? t("reapplied") : t("cancel")}
        </button>
      </div>
    );
  }

  // Skin type set, no active timer — burn-time estimate, SPF choice, start.
  const burn = burnMinutes(skinType, uv);
  return (
    <div className={`${GLASS} flex flex-col items-center gap-3 px-4 py-3.5 text-center`}>
      {burn !== null && (
        <p className="text-xs text-white/70">
          {t("burnEstimate", { minutes: burn })}
        </p>
      )}

      <div className="flex flex-col items-center gap-1.5">
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
        <Link
          href="/learn#spf"
          className="max-w-[22ch] text-[11px] leading-snug text-white/65 underline-offset-2 hover:text-white/85 hover:underline"
        >
          {t("spfNote")}
        </Link>
      </div>

      <button
        onClick={start}
        className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink transition-transform active:scale-[0.97]"
      >
        {t("start")}
      </button>
    </div>
  );
}
