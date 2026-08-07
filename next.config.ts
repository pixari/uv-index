import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// The one third-party origin the client actually talks to (self-hosted
// Umami-style analytics, loaded in layout.tsx) — everything else the app
// fetches (MET Norway, Open-Meteo, BigDataCloud) happens server-side in
// API routes, which the browser's CSP has no visibility into anyway.
const ANALYTICS_ORIGIN = "https://analytics.pixari.dev";

// 'unsafe-inline' is a deliberate, narrow trade-off on both fronts:
// - style-src: the app renders many per-value inline `style={{...}}`
//   attributes (sky gradients, skin-tone swatches) that a strict
//   style-src would silently break.
// - script-src: Next's App Router injects its own inline hydration/RSC
//   payload <script> tags with no nonce, so a strict script-src would
//   break every page load, not just a few components. Dropping it would
//   mean adopting a nonce-based CSP — which in turn requires reading the
//   nonce from a per-request header on every page, undoing the static
//   rendering these routes now get (see setRequestLocale in layout.tsx).
//   No third-party script content runs here either way: the one external
//   origin below is loaded via `src=`, not inline.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${ANALYTICS_ORIGIN}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${ANALYTICS_ORIGIN}`,
  // Some browsers fall back to script-src for workers if this isn't set
  // explicitly, but not all — public/sw.js (registered for Web Push)
  // wants its own explicit allowance rather than riding on script-src's.
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default withNextIntl(nextConfig);
