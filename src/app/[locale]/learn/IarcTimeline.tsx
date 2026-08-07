"use client";

import { useTranslations } from "next-intl";
import type { IarcMilestone } from "@/lib/iarcTimeline";

export default function IarcTimeline({ milestones }: { milestones: IarcMilestone[] }) {
  const t = useTranslations("learn.iarc.milestones");

  return (
    <ol className="relative flex flex-col gap-6 border-l border-border pl-5">
      {milestones.map((m) => (
        <li key={m.year} className="relative">
          <span
            aria-hidden
            className="absolute top-1 -left-[25px] h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-bg"
          />
          <p className="font-display text-lg leading-none text-foreground">{m.year}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">{t(`${m.key}.text`)}</p>
          <a
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-brand-ink hover:underline"
          >
            {t(`${m.key}.source`)}
          </a>
        </li>
      ))}
    </ol>
  );
}
