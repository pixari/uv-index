"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Generalizes the home screen's ShareButton for a specific /learn section:
// shares a deep link (the section's #anchor) with a one-line synopsis of
// that section, rather than the live UV reading.
export default function ArticleShareButton({ text, anchor }: { text: string; anchor: string }) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}#${anchor}`
        : "";

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
      aria-label={copied ? t("copied") : t("share")}
      title={copied ? t("copied") : t("share")}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-brand-ink"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
        </svg>
      )}
    </button>
  );
}
