import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Fraunces } from "next/font/google";
import { routing } from "@/i18n/routing";
import "./globals.css";

// DESIGN.md's typography spec calls for Fraunces on the UV number and all
// page/section titles ("distinctive numeral shapes, warm and editorial
// rather than clinical") — this was specified but never actually wired up;
// --font-display just aliased to the system sans stack. Self-hosted via
// next/font (downloaded at build time, served from this origin, so it
// doesn't add a runtime dependency on Google's CDN or need a CSP allowance).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const SITE_URL = "https://uvindex.pixari.dev";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}`;
  }
  // Tells search engines which version to serve someone whose browser
  // language doesn't match any of the three we actually have — without
  // it, that traffic has no defined hreflang target at all.
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      title: "UV Index",
      statusBarStyle: "default",
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${SITE_URL}/${locale}`,
      siteName: "UV Index",
      locale,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Without this, next-intl falls back to resolving the locale from
  // request headers (middleware-negotiated Accept-Language), which is a
  // Request-time API and forces every page under here into per-request
  // dynamic rendering — even though generateStaticParams above already
  // enumerates every locale at build time. This call, plus passing
  // `locale` to the provider explicitly below, is what actually lets
  // Next prerender the three locale shells as static HTML instead of
  // re-running SSR on every single request.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`antialiased ${fraunces.variable}`}>
      <body className="bg-bg text-ink font-sans">
        <Script
          defer
          src="https://analytics.pixari.dev/script.js"
          data-website-id="c87465e5-3964-4abc-821b-a7e6c04484ab"
          strategy="afterInteractive"
        />
        <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
