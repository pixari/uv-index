"use client";

import { useTranslations } from "next-intl";
import type { ReflectiveSurface } from "@/lib/uvPhysics";

export default function ReflectanceChart({ surfaces }: { surfaces: ReflectiveSurface[] }) {
  const t = useTranslations("learn.physics.surfaces");
  const max = Math.max(...surfaces.map((s) => s.percent));

  return (
    <div className="flex flex-col gap-2.5" role="img" aria-label="UV reflected back up, by surface, as a percentage">
      {surfaces.map((s) => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">{t(s.key)}</span>
          <div className="flex-1 rounded-full bg-surface">
            <div
              className="h-2.5 rounded-full bg-brand transition-[width]"
              style={{ width: `${(s.percent / max) * 100}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
            {s.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}
