"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  SKIN_TYPES,
  getStoredSkinType,
  setStoredSkinType,
  type SkinType,
} from "@/lib/skinType";
import DataSourcesSheet from "./DataSourcesSheet";

const LOCALE_LABEL: Record<string, string> = {
  it: "Italiano",
  en: "English",
  de: "Deutsch",
};

export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [showDataSources, setShowDataSources] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
    setSkinType(getStoredSkinType());
  }, []);

  function close() {
    setOpen(false);
    setTimeout(onClose, 300);
  }

  function changeLocale(next: string) {
    router.replace(pathname, { locale: next });
  }

  function chooseSkinType(type: SkinType) {
    setSkinType(type);
    setStoredSkinType(type);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ backgroundColor: open ? "rgb(0 0 0 / 0.3)" : "rgb(0 0 0 / 0)" }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-bg p-6 pb-10 shadow-[0_-8px_30px_rgb(0_0_0_/_0.12)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl">{t("title")}</h2>
          <button
            onClick={close}
            className="text-muted hover:text-ink transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <h3 className="mb-2 text-sm font-medium text-muted">
          {t("language")}
        </h3>
        <div className="mb-6 flex gap-2">
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => changeLocale(l)}
              className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${
                l === locale
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 text-ink hover:bg-surface"
              }`}
            >
              {LOCALE_LABEL[l] ?? l}
            </button>
          ))}
        </div>

        <h3 className="mb-2 text-sm font-medium text-muted">
          {t("skinType")}
        </h3>
        <p className="mb-3 text-sm text-muted">{t("skinTypeHint")}</p>
        <div className="mb-2 grid grid-cols-6 gap-2">
          {SKIN_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => chooseSkinType(type)}
              aria-label={t(`skinTypes.${type}`)}
              className={`aspect-square rounded-xl border text-sm font-medium transition-colors ${
                type === skinType
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 text-ink hover:bg-surface"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {skinType && (
          <p className="mb-6 text-sm text-muted">
            {t(`skinTypes.${skinType}`)}
          </p>
        )}

        <button
          onClick={() => setShowDataSources(true)}
          className="text-sm text-brand-ink underline-offset-4 hover:underline"
        >
          {t("dataSourcesLink")}
        </button>
      </div>

      {showDataSources && (
        <DataSourcesSheet onClose={() => setShowDataSources(false)} />
      )}
    </div>
  );
}
