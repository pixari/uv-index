"use client";

import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import { SKIN_TYPES, SKIN_TONE_SWATCH, type SkinType } from "@/lib/skinType";
import type { Profile } from "@/lib/profiles";
import Toggle from "./Toggle";

// The "Skin type" section of Settings — the Fitzpatrick slider/swatches,
// the infant toggle, and the AAP/AAD infant advisory that replaces the
// slider entirely when it's on. `profile` stays a prop rather than
// state owned here since ProfileManager (a sibling, not a parent) is
// what actually changes which profile is selected.
export default function SkinTypePicker({
  profile,
  onChangeSkinType,
  onToggleInfant,
}: {
  profile: Profile | undefined;
  onChangeSkinType: (type: SkinType) => void;
  onToggleInfant: (next: boolean) => void;
}) {
  const t = useTranslations("settings");
  const displayedType = profile?.skinType ?? 3;

  function handleSliderChange(value: number | readonly number[]) {
    onChangeSkinType((Array.isArray(value) ? value[0] : value) as SkinType);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">{t("skinType")}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t("infantToggleLabel")}
          </span>
          <Toggle
            checked={!!profile?.isInfant}
            onChange={onToggleInfant}
            label={t("infantToggleLabel")}
          />
        </div>
      </div>

      {profile?.isInfant ? (
        // AAP/AAD guidance for infants under 6 months is "no direct sun
        // at all" — the Fitzpatrick slider below doesn't apply and would
        // misleadingly imply a burn-time budget exists.
        <p className="text-sm text-muted-foreground leading-relaxed">{t("infantHint")}</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{t("skinTypeHint")}</p>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-5">
            <div
              className="h-14 w-14 rounded-full border border-border transition-colors"
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
              onValueChange={handleSliderChange}
              className="w-full max-w-[220px]"
            />
            <div className="flex w-full max-w-[220px] justify-between px-0.5">
              {SKIN_TYPES.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={t(`skinTypes.${n}`)}
                  onClick={() => onChangeSkinType(n)}
                  className="h-4 w-4 rounded-full transition-transform"
                  style={{
                    backgroundColor: SKIN_TONE_SWATCH[n],
                    outline: n === displayedType ? "2px solid var(--brand)" : "2px solid transparent",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("skinTypeWhy")}</p>
        </>
      )}
    </div>
  );
}
