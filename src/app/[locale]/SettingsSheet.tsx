"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SkinType } from "@/lib/skinType";
import {
  getProfiles,
  addProfile,
  removeProfile,
  setProfileSkinType,
  setProfileIsInfant,
  resolveActiveProfileId,
  setActiveProfileId,
  type Profile,
} from "@/lib/profiles";
import { clearReapplyTimer, clearStoredSpf } from "@/lib/reapplyTimer";
import { markSettingsForReopen } from "@/lib/pendingSettingsReopen";
import { cancelReapplyPush } from "@/lib/pushClient";
import DataSourcesSheet from "./DataSourcesSheet";
import ScienceSheet from "./ScienceSheet";
import ProfileManager from "./ProfileManager";
import NotificationSettings from "./NotificationSettings";
import SkinTypePicker from "./SkinTypePicker";

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
  // "defaultProfileName" lives under "home" (HomeClient creates the same
  // default profile the first time the app ever runs, before Settings has
  // been opened) — look it up from there so both call sites agree.
  const tHome = useTranslations("home");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [showDataSources, setShowDataSources] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const list = getProfiles(tHome("defaultProfileName"));
    setProfiles(list);
    setSelectedProfileId(resolveActiveProfileId(tHome("defaultProfileName")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function changeLocale(next: string) {
    // Switching language navigates to a different /[locale]/ URL, which
    // remounts the page and would otherwise close this sheet.
    markSettingsForReopen();
    router.replace(pathname, { locale: next });
  }

  function selectProfile(id: string) {
    setSelectedProfileId(id);
    setActiveProfileId(id);
  }

  function handleChangeSkinType(type: SkinType) {
    if (!selectedProfileId) return;
    setProfileSkinType(selectedProfileId, type);
    setProfiles((prev) =>
      prev.map((p) => (p.id === selectedProfileId ? { ...p, skinType: type } : p)),
    );
  }

  function handleToggleInfant(next: boolean) {
    if (!selectedProfileId) return;
    setProfileIsInfant(selectedProfileId, next);
    setProfiles((prev) =>
      prev.map((p) => (p.id === selectedProfileId ? { ...p, isInfant: next } : p)),
    );
  }

  function handleAddProfile(name: string) {
    const created = addProfile(name);
    setProfiles((prev) => [...prev, created]);
    selectProfile(created.id);
  }

  function handleRemoveProfile(id: string) {
    if (profiles.length <= 1) return;
    const remaining = removeProfile(id);
    // removeProfile only drops the profile record — its reapply timer and
    // SPF choice live under separate scoped keys and would otherwise sit
    // orphaned in storage forever. Same for any reminder already armed
    // server-side for this profile — best-effort, no local state to undo.
    clearReapplyTimer(id);
    clearStoredSpf(id);
    cancelReapplyPush(id);
    setProfiles(remaining);
    if (selectedProfileId === id) {
      setSelectedProfileId(remaining[0]?.id ?? null);
    }
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

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

            <ProfileManager
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onSelect={selectProfile}
              onAdd={handleAddProfile}
              onRemove={handleRemoveProfile}
            />

            <NotificationSettings open={open} />

            <SkinTypePicker
              profile={selectedProfile}
              onChangeSkinType={handleChangeSkinType}
              onToggleInfant={handleToggleInfant}
            />

            {/* "More info" cluster — the app's second, more prominent
                path to /learn (the first is the quiet link at the bottom
                of Home), plus the two sheets that used to be reachable
                only from Home (Science) or buried at the very end of this
                list on their own (Data sources). Grouped together since
                they're all the same kind of thing: where to go to read
                more, rather than to change a setting. */}
            <div className="flex flex-col items-start gap-2">
              <Link
                href="/learn"
                className="text-sm text-brand-ink underline-offset-4 hover:underline"
              >
                {t("learnMoreLink")}
              </Link>
              <button
                onClick={() => setShowScience(true)}
                className="text-left text-sm text-brand-ink underline-offset-4 hover:underline"
              >
                {t("scienceLink")}
              </button>
              <button
                onClick={() => setShowDataSources(true)}
                className="text-left text-sm text-brand-ink underline-offset-4 hover:underline"
              >
                {t("dataSourcesLink")}
              </button>
              <Link
                href="/privacy"
                className="text-sm text-brand-ink underline-offset-4 hover:underline"
              >
                {t("privacyLink")}
              </Link>
              <a
                href="https://github.com/pixari/uv-index"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-ink underline-offset-4 hover:underline"
              >
                {t("sourceLink")}
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ScienceSheet open={showScience} onOpenChange={setShowScience} />
      <DataSourcesSheet
        open={showDataSources}
        onOpenChange={setShowDataSources}
      />
    </>
  );
}
