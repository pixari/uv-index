"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getReapplyStartedAt,
  startReapplyTimer,
  clearReapplyTimer,
  minutesRemaining,
} from "@/lib/reapplyTimer";
import { getStoredSkinType, burnMinutes, type SkinType } from "@/lib/skinType";

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

  useEffect(() => {
    setSkinType(getStoredSkinType());
    setStartedAt(getReapplyStartedAt());
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
        className="flex w-full max-w-xs flex-col items-center gap-1 rounded-2xl border border-dashed border-black/15 px-4 py-3.5 text-center hover:bg-surface transition-colors"
      >
        <span className="text-sm text-ink">{t("setupPrompt")}</span>
        <span className="text-xs text-brand-ink">{t("setupCta")}</span>
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
      <div className="flex w-full max-w-xs flex-col items-center gap-1.5 rounded-2xl border border-black/10 px-4 py-3.5 text-center">
        <p
          className={
            overdue
              ? "text-sm font-medium text-brand-ink"
              : "text-sm text-ink"
          }
        >
          {overdue ? t("overdue") : t("countdown", { time: timeLabel })}
        </p>
        <button
          onClick={overdue ? start : reset}
          className="text-xs text-muted underline underline-offset-4 hover:text-brand-ink transition-colors"
        >
          {overdue ? t("reapplied") : t("cancel")}
        </button>
      </div>
    );
  }

  // Skin type set, no active timer — burn-time estimate + start button.
  const burn = burnMinutes(skinType, uv);
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border border-black/10 px-4 py-3.5 text-center">
      {burn !== null && (
        <p className="text-xs text-muted">{t("burnEstimate", { minutes: burn })}</p>
      )}
      <button
        onClick={start}
        className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        {t("start")}
      </button>
    </div>
  );
}
