// The app's signature mark — the same gradient used across every icon and
// social-preview image (app icon, Apple touch icon, PWA icons, OG images).
// Each of those is its own isolated next/og ImageResponse (they can't share
// a React component the way normal pages do), so this constant is what
// actually keeps them all in sync if the palette ever changes.
export const BRAND_MARK_GRADIENT =
  "linear-gradient(135deg, #3EA72D 0%, #FFF300 35%, #F18B00 65%, #E53210 100%)";
