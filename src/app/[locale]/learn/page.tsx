import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LearnClient from "./LearnClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learn" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default function LearnPage() {
  return <LearnClient />;
}
