import { WHO_LEVEL_COLOR, UV_SCALE_MAX, type UvLevel } from "@/lib/uvLevel";
import { BRAND_MARK_GRADIENT } from "@/lib/brandGradient";

// Same 5-stop WHO scale WhoGradientBar.tsx renders in-app (reused, not
// re-picked, so the social-preview bar can never quietly drift from the
// real one) — computed here instead of imported because WhoGradientBar
// is a Tailwind/CSS-custom-property component and this needs a literal
// style string Satori (next/og's renderer) can read directly.
const WHO_STOPS: { level: UvLevel; upTo: number }[] = [
  { level: "low", upTo: 3 },
  { level: "moderate", upTo: 6 },
  { level: "high", upTo: 8 },
  { level: "veryHigh", upTo: 11 },
  { level: "extreme", upTo: UV_SCALE_MAX },
];
export const WHO_GRADIENT_CSS = `linear-gradient(to right, ${WHO_STOPS.map(
  (s, i) =>
    `${WHO_LEVEL_COLOR[s.level]} ${((WHO_STOPS[i - 1]?.upTo ?? 0) / UV_SCALE_MAX) * 100}%, ${WHO_LEVEL_COLOR[s.level]} ${(s.upTo / UV_SCALE_MAX) * 100}%`,
).join(", ")})`;

/**
 * Home's card: full-bleed brand gradient (the same one on the app icon),
 * a soft "sun glow" in the corner, and the title/description in white —
 * this is meant to look unmistakably like the app itself opening, not a
 * generic white card with a small logo dot on it.
 */
export function HomeOgCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: BRAND_MARK_GRADIENT,
      }}
    >
      {/* Soft glow, faked with stacked translucent circles since this
          renderer doesn't reliably support filter: blur(). */}
      <div style={{ position: "absolute", top: -180, right: -180, display: "flex" }}>
        <div
          style={{
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.16)",
            display: "flex",
          }}
        />
      </div>
      <div style={{ position: "absolute", top: -80, right: -80, display: "flex" }}>
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            display: "flex",
          }}
        />
      </div>

      {/* Scrim: light at the top so the gradient stays vibrant, heavier
          toward the bottom where the white text needs to stay legible. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: "linear-gradient(180deg, rgba(8,10,20,0.05) 0%, rgba(8,10,20,0.78) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#ffffff",
              display: "flex",
            }}
          />
          <span style={{ fontSize: 28, fontWeight: 600, fontFamily: "Fraunces", color: "#fff" }}>
            UV Index
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span
            style={{
              fontSize: 62,
              fontWeight: 700,
              fontFamily: "Fraunces",
              color: "#fff",
              lineHeight: 1.08,
              maxWidth: 1000,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 29,
              color: "rgba(255,255,255,0.9)",
              maxWidth: 920,
              lineHeight: 1.45,
            }}
          >
            {description}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The light/editorial card shared by /learn and /privacy — deliberately
 * not tinted like Home's card (same "sheets stay light" logic documented
 * elsewhere in this app: those two pages are the reading material, not
 * the live gradient-sky experience, and their own pages already look like
 * this — eyebrow, big Fraunces headline, the WHO gradient bar as the one
 * graphic accent). The eyebrow line is what tells two cards from this same
 * template apart in a chat thread ("La scienza della protezione solare"
 * vs. "Legal"), so there's no separate badge prop to keep in sync with it.
 */
export function EditorialOgCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{ width: 40, height: 40, borderRadius: "50%", background: BRAND_MARK_GRADIENT, display: "flex" }}
        />
        <span style={{ fontSize: 26, fontWeight: 600, fontFamily: "Fraunces", color: "#111827" }}>
          UV Index
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#2f6fa8",
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontSize: 66,
            fontWeight: 700,
            fontFamily: "Fraunces",
            color: "#111827",
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {title}
        </span>
        <div style={{ display: "flex", width: "100%", height: 14, borderRadius: 999, background: WHO_GRADIENT_CSS }} />
        <span style={{ fontSize: 28, color: "#6b7280", maxWidth: 920, lineHeight: 1.45 }}>
          {description}
        </span>
      </div>
    </div>
  );
}
