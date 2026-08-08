import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import PrivacyClient from "./PrivacyClient";

const SITE_URL = "https://uvindex.pixari.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}/privacy`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/privacy`;

  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/privacy`,
      languages,
    },
    // Previously absent here — without its own openGraph/twitter, this
    // page silently inherited Home's title, description, URL, *and*
    // image (the opengraph-image file convention falls back up the route
    // tree too), so sharing the privacy policy looked exactly like
    // sharing the homepage. It now has its own of all four.
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      url: `${SITE_URL}/${locale}/privacy`,
      siteName: "UV Index",
      locale,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("metaDescription"),
    },
    robots: {
      // Legal boilerplate isn't worth ranking for and would just dilute
      // the site's actual content in search results.
      index: false,
      follow: true,
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyClient />;
}
