import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PrivacyClient from "./PrivacyClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    robots: {
      // Legal boilerplate isn't worth ranking for and would just dilute
      // the site's actual content in search results.
      index: false,
      follow: true,
    },
  };
}

export default function PrivacyPage() {
  return <PrivacyClient />;
}
