"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ShareButton({
  uv,
  riskLabel,
  place,
}: {
  uv: number;
  riskLabel: string;
  place: string;
}) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = t("text", { uv: Math.round(uv), riskLabel, place });
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op, button just does nothing further
    }
  }

  return (
    <button
      onClick={share}
      className="flex items-center gap-1.5 text-xs text-white/55 hover:text-white transition-colors"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      </svg>
      {copied ? t("copied") : t("share")}
    </button>
  );
}
