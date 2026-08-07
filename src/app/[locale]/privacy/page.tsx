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
