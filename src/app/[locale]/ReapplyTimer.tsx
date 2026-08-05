"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <Card
        className="w-full max-w-xs cursor-pointer items-center gap-1 border-dashed px-4 py-3.5 text-center shadow-none ring-black/15 hover:bg-surface transition-colors"
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
      <Card className="w-full max-w-xs items-center gap-1.5 px-4 py-3.5 text-center shadow-none ring-black/10">
        <p
          className={
            overdue
              ? "text-sm font-medium text-brand-ink"
              : "text-sm text-foreground"
          }
        >
          {overdue ? t("overdue") : t("countdown", { time: timeLabel })}
        </p>
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

  // Skin type set, no active timer — burn-time estimate + start button.
  const burn = burnMinutes(skinType, uv);
  return (
    <Card className="w-full max-w-xs items-center gap-2 px-4 py-3.5 text-center shadow-none ring-black/10">
      {burn !== null && (
        <p className="text-xs text-muted-foreground">
          {t("burnEstimate", { minutes: burn })}
        </p>
      )}
      <Button onClick={start}>{t("start")}</Button>
    </Card>
  );
}
