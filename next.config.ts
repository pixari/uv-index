import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// The one third-party origin the client actually talks to (self-hosted
// Umami-style analytics, loaded in layout.tsx) — everything else the app
// fetches (MET Norway, Open-Meteo, BigDataCloud) happens server-side in
// API routes, which the browser's CSP has no visibility into anyway.
const ANALYTICS_ORIGIN = "https://analytics.pixari.dev";

// 'unsafe-inline' on style-src is a deliberate, narrow trade-off: the app
// renders many per-value inline `style={{...}}` attributes (sky gradients,
// skin-tone swatches) that a strict style-src would silently break. Kept
// out of script-src, where it matters far more.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${ANALYTICS_ORIGIN}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${ANALYTICS_ORIGIN}`,
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
