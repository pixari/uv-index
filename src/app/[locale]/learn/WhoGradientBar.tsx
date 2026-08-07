import { WHO_LEVEL_COLOR, UV_SCALE_MAX, type UvLevel } from "@/lib/uvLevel";

const STOPS: { level: UvLevel; upTo: number }[] = [
  { level: "low", upTo: 3 },
  { level: "moderate", upTo: 6 },
  { level: "high", upTo: 8 },
  { level: "veryHigh", upTo: 11 },
  { level: "extreme", upTo: UV_SCALE_MAX },
];

const GRADIENT = STOPS.map(
  (s, i) =>
    `${WHO_LEVEL_COLOR[s.level]} ${((STOPS[i - 1]?.upTo ?? 0) / UV_SCALE_MAX) * 100}%, ${WHO_LEVEL_COLOR[s.level]} ${(s.upTo / UV_SCALE_MAX) * 100}%`,
).join(", ");

// A purely identity-carrying reuse of the app's actual WHO scale — not
// attached to a live reading or a specific claim, so it doesn't dilute the
// scale's real job elsewhere (DESIGN.md: "treat it with the same rigor as
// a warning label, not as a mood gradient"). This is the one place on
// /learn that's allowed to just be the app's signature color, unattached.
export default function WhoGradientBar() {
  return (
    <div
      aria-hidden
      className="h-2 w-full rounded-full"
      style={{ background: `linear-gradient(to right, ${GRADIENT})` }}
    />
  );
}
