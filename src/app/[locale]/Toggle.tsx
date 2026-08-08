"use client";

// Shared by NotificationSettings (reapply/high-UV) and SkinTypePicker
// (infant) — was defined inline in SettingsSheet.tsx before it split
// into those pieces.
export default function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 " +
        (checked ? "bg-brand" : "bg-border")
      }
    >
      <span
        className={
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform " +
          (checked ? "translate-x-[22px]" : "translate-x-0.5")
        }
      />
    </button>
  );
}
