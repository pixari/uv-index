import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import LearnClient from "./LearnClient";

const SITE_URL = "https://uvindex.pixari.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learn" });

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}/learn`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/learn`;

  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/learn`,
      languages,
    },
    openGraph: {
      title: t("title"),
      description: t("metaDescription"),
      url: `${SITE_URL}/${locale}/learn`,
      siteName: "UV Index",
      locale,
      type: "article",
    },
  };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LearnClient />;
}
