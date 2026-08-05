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
import { SKIN_TYPES, SKIN_TONE_SWATCH, type SkinType } from "@/lib/skinType";
import {
  getProfiles,
  addProfile,
  removeProfile,
  setProfileSkinType,
  resolveActiveProfileId,
  setActiveProfileId,
  type Profile,
} from "@/lib/profiles";
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
  const [showDataSources, setShowDataSources] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    if (!open) return;
    const list = getProfiles(t("defaultProfileName"));
    setProfiles(list);
    setSelectedProfileId(resolveActiveProfileId(t("defaultProfileName")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function changeLocale(next: string) {
    router.replace(pathname, { locale: next });
  }

  function selectProfile(id: string) {
    setSelectedProfileId(id);
    setActiveProfileId(id);
  }

  function chooseSkinType(value: number | readonly number[]) {
    if (!selectedProfileId) return;
    const type = (Array.isArray(value) ? value[0] : value) as SkinType;
    setProfileSkinType(selectedProfileId, type);
    setProfiles((prev) =>
      prev.map((p) => (p.id === selectedProfileId ? { ...p, skinType: type } : p)),
    );
  }

  function confirmAddProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    const created = addProfile(name);
    setProfiles((prev) => [...prev, created]);
    selectProfile(created.id);
    setNewProfileName("");
    setAddingProfile(false);
  }

  function handleRemoveProfile(id: string) {
    if (profiles.length <= 1) return;
    const remaining = removeProfile(id);
    setProfiles(remaining);
    if (selectedProfileId === id) {
      setSelectedProfileId(remaining[0]?.id ?? null);
    }
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const displayedType = selectedProfile?.skinType ?? 3;

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
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {t("profiles")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => (
                  <div key={p.id} className="flex items-center">
                    <button
                      onClick={() => selectProfile(p.id)}
                      className={
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
                        (p.id === selectedProfileId
                          ? "bg-brand text-primary-foreground"
                          : "bg-surface text-foreground hover:bg-border")
                      }
                    >
                      {p.name}
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleRemoveProfile(p.id)}
                        aria-label={t("removeProfile", { name: p.name })}
                        className="-ml-1 p-1 text-muted-foreground hover:text-foreground"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {!addingProfile && (
                  <button
                    onClick={() => setAddingProfile(true)}
                    className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                  >
                    + {t("addProfile")}
                  </button>
                )}
              </div>

              {addingProfile && (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmAddProfile()}
                    placeholder={t("newProfileNamePlaceholder")}
                    className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
                  />
                  <Button size="sm" onClick={confirmAddProfile}>
                    {t("addProfileConfirm")}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                {t("skinType")}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("skinTypeHint")}
              </p>

              <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-4 shadow-md ring-1 ring-foreground/5">
                <div
                  className="h-14 w-14 rounded-full border border-black/10 shadow-inner transition-colors"
                  style={{ backgroundColor: SKIN_TONE_SWATCH[displayedType as SkinType] }}
                  aria-hidden
                />
                <div className="flex flex-col items-center gap-1">
                  <p className="text-center text-sm font-semibold text-foreground">
                    {t(`skinTypes.${displayedType}`)}
                  </p>
                  <p className="max-w-[30ch] text-center text-xs leading-snug text-muted-foreground">
                    {t(`skinTypeExamples.${displayedType}`)}
                  </p>
                </div>
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
                    <button
                      key={n}
                      type="button"
                      aria-label={t(`skinTypes.${n}`)}
                      onClick={() => chooseSkinType(n)}
                      className="h-4 w-4 rounded-full transition-transform"
                      style={{
                        backgroundColor: SKIN_TONE_SWATCH[n],
                        outline:
                          n === displayedType
                            ? "2px solid var(--brand)"
                            : "2px solid transparent",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("skinTypeWhy")}
              </p>
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
