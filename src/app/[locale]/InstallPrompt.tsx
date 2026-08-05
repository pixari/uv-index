"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const DISMISSED_KEY = "uv-index:install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const t = useTranslations("install");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-bg px-4 py-3 shadow-[0_4px_20px_rgb(0_0_0_/_0.12)]">
      <p className="text-sm text-ink">{t("prompt")}</p>
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={dismiss}
          className="text-sm text-muted-foreground hover:text-ink transition-colors"
        >
          {t("dismiss")}
        </button>
        <button
          onClick={install}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          {t("install")}
        </button>
      </div>
    </div>
  );
}
