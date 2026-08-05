"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <Card
        className="w-full max-w-xs cursor-pointer items-center gap-1 border-dashed px-4 py-3.5 text-center ring-black/15 hover:bg-surface transition-colors"
        onClick={onOpenSettings}
      >
        <span className="text-sm text-foreground">{t("setupPrompt")}</span>
        <span className="text-xs text-brand-ink">{t("setupCta")}</span>
      </Card>
    );
  }

  // Active countdown running.
  if (startedAt !== null && remaining !== null) {
    const overdue = remaining <= 0;
    const h = Math.floor(Math.abs(remaining) / 60);
    const m = Math.abs(remaining) % 60;
    const timeLabel = h > 0 ? `${h}h ${m}min` : `${m}min`;

    return (
      <Card className="w-full max-w-xs items-center gap-1.5 px-4 py-3.5 text-center shadow-md ring-1 ring-foreground/5">
        <p
          className={
            overdue
              ? "text-sm font-medium text-brand-ink"
              : "text-sm text-foreground"
          }
        >
          {overdue ? t("overdue") : t("countdown", { time: timeLabel })}
        </p>
        {spf && (
          <p className="text-xs text-muted-foreground">
            {t("spfInUse", { spf: spfLabel(spf) })}
          </p>
        )}
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground"
          onClick={overdue ? start : reset}
        >
          {overdue ? t("reapplied") : t("cancel")}
        </Button>
      </Card>
    );
  }

  // Skin type set, no active timer — burn-time estimate, SPF choice, start.
  const burn = burnMinutes(skinType, uv);
  return (
    <Card className="w-full max-w-xs items-center gap-3 px-4 py-3.5 text-center shadow-md ring-1 ring-foreground/5">
      {burn !== null && (
        <p className="text-xs text-muted-foreground">
          {t("burnEstimate", { minutes: burn })}
        </p>
      )}

      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
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
                  ? "bg-brand text-primary-foreground"
                  : "bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/20")
              }
              aria-pressed={pendingSpf === option}
            >
              {spfLabel(option)}
            </button>
          ))}
        </div>
        <Link
          href="/learn#spf"
          className="max-w-[22ch] text-[11px] leading-snug text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("spfNote")}
        </Link>
      </div>

      <Button onClick={start}>{t("start")}</Button>
    </Card>
  );
}
