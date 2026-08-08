"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SKIN_TONE_SWATCH } from "@/lib/skinType";
import type { Profile } from "@/lib/profiles";

function ProfileAvatar({ profile }: { profile: Profile }) {
  // Skin type doesn't apply to an infant profile — the avatar shouldn't
  // imply it does by tinting itself from a value that's not being used.
  const tone =
    !profile.isInfant && profile.skinType ? SKIN_TONE_SWATCH[profile.skinType] : undefined;
  const initial = profile.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className={
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold " +
        (tone
          ? profile.skinType! >= 4
            ? "text-white"
            : "text-ink"
          : "bg-border text-muted-foreground")
      }
      style={tone ? { backgroundColor: tone } : undefined}
    >
      {initial}
    </span>
  );
}

// The "People" section of Settings — profile chips (select/remove) plus
// the inline add-person composer. Split out of SettingsSheet since it's
// the one section with its own meaningful local UI state (the composer's
// open/closed state and draft name) that the rest of the sheet has no
// reason to know about; actual profile data stays lifted in the parent,
// since the Skin type section elsewhere in the sheet needs it too.
export default function ProfileManager({
  profiles,
  selectedProfileId,
  onSelect,
  onAdd,
  onRemove,
}: {
  profiles: Profile[];
  selectedProfileId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("settings");
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  function confirmAddProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    onAdd(name);
    setNewProfileName("");
    setAddingProfile(false);
  }

  function cancelAddProfile() {
    setAddingProfile(false);
    setNewProfileName("");
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t("profiles")}</h3>
      <div className="flex flex-wrap items-center gap-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={
              "flex items-center rounded-full text-sm font-medium transition-colors " +
              (p.id === selectedProfileId
                ? "bg-brand text-primary-foreground"
                : "bg-surface text-foreground hover:bg-border")
            }
          >
            <button
              onClick={() => onSelect(p.id)}
              className="flex items-center gap-1.5 py-1 pl-1 pr-1.5"
            >
              <ProfileAvatar profile={p} />
              {p.name}
            </button>
            {profiles.length > 1 && (
              <button
                onClick={() => onRemove(p.id)}
                aria-label={t("removeProfile", { name: p.name })}
                className="p-1.5 pr-2.5 opacity-70 transition-opacity hover:opacity-100"
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

        {addingProfile ? (
          <div className="flex items-center gap-1 rounded-full border border-brand bg-surface py-1 pr-1 pl-3">
            <input
              autoFocus
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAddProfile();
                if (e.key === "Escape") {
                  // Cancel just this composer — without stopping
                  // propagation, Escape also bubbles to the sheet's
                  // own dismiss handler and closes the whole panel.
                  e.stopPropagation();
                  cancelAddProfile();
                }
              }}
              placeholder={t("newProfileNamePlaceholder")}
              className="w-24 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={confirmAddProfile}
              aria-label={t("addProfileConfirm")}
              className="flex h-6 w-6 items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-brand/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              onClick={cancelAddProfile}
              aria-label={t("cancelAddProfile")}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingProfile(true)}
            aria-label={t("addProfile")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
