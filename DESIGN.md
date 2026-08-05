# Design

## Theme

Light. Mood: "alpine weather station — clear-sky precision, calm and trusted, meant to be read at a glance in bright daylight." The primary real-world usage is an outdoor glance in glare, and pure white with dark/saturated text gives the highest practical contrast in sunlight — a deliberate functional choice, not a default.

## Color strategy

Two-tier system, not one palette:

- **Brand** (cobalt, restrained) — UI chrome only: links, focus states, the location control. Never used for risk communication.
- **Semantic** (WHO UV scale, committed) — the risk-tier color is the product's core signal. It's allowed real visual weight (the big number itself, in a deepened/legible variant), unlike a typical restrained product accent.

The raw WHO hex values (`#FFF300` etc.) are the official reference scale and are used unmodified only in the small reference bar. As large text on white, several of them (pure yellow especially) fail contrast — a refined "on-white" variant carries the actual number/label color.

## Tokens (OKLCH)

```css
--bg: oklch(1 0 0); /* pure white */
--surface: oklch(0.97 0.005 230); /* sheets, subtle panels */
--ink: oklch(0.18 0.02 230); /* body text, ~15:1 on bg */
--muted: oklch(0.5 0.02 230); /* secondary text, ~4.6:1 on bg */
--brand: oklch(0.55 0.14 230); /* cobalt — links, focus, location control */
--brand-ink: oklch(0.3 0.1 230); /* brand text on white, higher contrast */

/* WHO reference scale — official colors, swatches only */
--who-low: #3ea72d;
--who-moderate: #fff300;
--who-high: #f18b00;
--who-very-high: #e53210;
--who-extreme: #b567a4;

/* Deepened variants — legible as large text on pure white (>=3:1, most >=4.5:1) */
--risk-low: oklch(0.5 0.15 145);
--risk-moderate: oklch(0.55 0.14 90);
--risk-high: oklch(0.58 0.18 55);
--risk-very-high: oklch(0.52 0.2 25);
--risk-extreme: oklch(0.42 0.15 320);
```

## Typography

- **Display (the UV number, page/section titles)**: Fraunces (variable serif). Distinctive numeral shapes, warm and editorial rather than clinical — carries "elegant, not banal" on its own before any color is applied.
- **Body / UI chrome**: Geist Sans. Clean, already in use, pairs on a serif/sans contrast axis with Fraunces per the "pair on a contrast axis" rule.
- Geist Mono dropped — unused, no code/tabular content in this product.
- Display ceiling: the UV number is the one deliberate exception to the 6rem heading cap (it IS the product), sized with `clamp()` up to viewport-relative sizing, tracked tight (`-0.04em` floor respected) at large sizes.

## Layout — Home

Not a dashboard hero-metric (big number / small label / stat row / gradient accent). Instead, an editorial single-statement layout:

1. **Location control** — top, quiet: small icon + place name in `--muted`, brand-colored on interaction.
2. **The number** — center, massive, set in Fraunces, colored with the deepened risk variant as the text fill itself (not a filled badge/circle). Pure white behind it. This is the single largest, most confident element on the page.
3. **Risk word** — directly below, same color family, large and confident (not a tiny caption).
4. **Action sentence** — one calm, specific line in `--ink`.
5. **WHO reference bar** — a compact horizontal 0-11+ gradient strip (official WHO colors) with a marker at the current value. Serves two purposes: scientific legitimacy (the real WHO scale, not an invented one) and a non-color-dependent position cue (satisfies "never rely on hue alone").
6. **"Perché?"** — quiet text link in brand cobalt at the bottom, not a bordered pill (pills read SaaS; a text link reads editorial and matches the register of the future long-form science pages).

## Sheets (Location, Science)

Light surface (`--surface`), not dark. Slide up from the bottom with a soft shadow, generous padding, rounded top corners. Spring-out easing (ease-out-expo, no bounce), with an instant/crossfade fallback under `prefers-reduced-motion`.

## Motion

Restrained, intentional, never gratuit:

- Number: fade + slight scale-up on first resolution (ease-out-quart, ~400ms), respects reduced motion (instant swap).
- Sheets: translate-y slide-up with backdrop fade, ease-out-expo.
- No ambient/looping decorative animation — this is a health-safety tool, not a marketing surface; motion serves state changes only.

## Components

- `LocationSheet`, `ScienceSheet`: light theme, shared sheet shell treatment (see above).
- WHO reference bar: new small component, shared between Home and the future Science/data-source pages.
