"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  SKIN_TYPES,
  getStoredSkinType,
  setStoredSkinType,
  SKIN_TONE_SWATCH,
  type SkinType,
} from "@/lib/skinType";
import DataSourcesSheet from "./DataSourcesSheet";

const LOCALE_LABEL: Record<string, string> = {
  it: "Italiano",
  en: "English",
  de: "Deutsch",
};

export default function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [showDataSources, setShowDataSources] = useState(false);

  useEffect(() => {
    setSkinType(getStoredSkinType());
  }, []);

  function changeLocale(next: string) {
    router.replace(pathname, { locale: next });
  }

  function chooseSkinType(value: number | readonly number[]) {
    const type = (Array.isArray(value) ? value[0] : value) as SkinType;
    setSkinType(type);
    setStoredSkinType(type);
  }

  const displayedType = skinType ?? 3;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">
              {t("title")}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-4">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {t("language")}
              </h3>
              <div className="flex gap-2">
                {routing.locales.map((l) => (
                  <Button
                    key={l}
                    variant={l === locale ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => changeLocale(l)}
                  >
                    {LOCALE_LABEL[l] ?? l}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                {t("skinType")}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("skinTypeHint")}
              </p>

              <div className="flex flex-col items-center gap-4 rounded-2xl border border-border p-4">
                <div
                  className="h-14 w-14 rounded-full border border-black/10 shadow-inner transition-colors"
                  style={{ backgroundColor: SKIN_TONE_SWATCH[displayedType as SkinType] }}
                  aria-hidden
                />
                <p className="text-center text-sm font-medium text-foreground">
                  {t(`skinTypes.${displayedType}`)}
                </p>
                <Slider
                  value={[displayedType]}
                  min={1}
                  max={6}
                  step={1}
                  onValueChange={chooseSkinType}
                  className="w-full max-w-[220px]"
                />
                <div className="flex w-full max-w-[220px] justify-between px-0.5">
                  {SKIN_TYPES.map((n) => (
                    <span
                      key={n}
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: SKIN_TONE_SWATCH[n] }}
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="link"
              className="h-auto justify-start p-0 text-brand-ink"
              onClick={() => setShowDataSources(true)}
            >
              {t("dataSourcesLink")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <DataSourcesSheet
        open={showDataSources}
        onOpenChange={setShowDataSources}
      />
    </>
  );
}
