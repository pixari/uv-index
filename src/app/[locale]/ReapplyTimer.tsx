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

export default function ReapplyTimer({ uv }: { uv: number }) {
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

  if (!skinType) return null;

  function start() {
    startReapplyTimer();
    setStartedAt(getReapplyStartedAt());
  }

  function reset() {
    clearReapplyTimer();
    setStartedAt(null);
  }

  // Active countdown running.
  if (startedAt !== null && remaining !== null) {
    const overdue = remaining <= 0;
    const h = Math.floor(Math.abs(remaining) / 60);
    const m = Math.abs(remaining) % 60;
    const timeLabel = h > 0 ? `${h}h ${m}min` : `${m}min`;

    return (
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-black/10 px-4 py-3 text-center">
        <p className={overdue ? "text-sm font-medium text-brand-ink" : "text-sm text-ink"}>
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

  // No active timer — offer to start one, plus the burn-time estimate.
  const burn = burnMinutes(skinType, uv);
  return (
    <div className="flex flex-col items-center gap-2">
      {burn !== null && (
        <p className="text-xs text-muted">
          {t("burnEstimate", { minutes: burn })}
        </p>
      )}
      <button
        onClick={start}
        className="rounded-full border border-black/10 px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
      >
        {t("start")}
      </button>
    </div>
  );
}
