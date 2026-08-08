import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { MYTH_KEYS } from "@/lib/mythSources";
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
    // Without its own `twitter` object here, this page silently inherited
    // the root layout's — meaning sharing /learn on X showed Home's title
    // and description under /learn's own (correct) image. Metadata fields
    // aren't deep-merged per sub-field the way `openGraph.title` above
    // might suggest; a child page's `twitter` object fully replaces the
    // parent's rather than filling in the gaps.
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("metaDescription"),
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
  const t = await getTranslations({ locale, namespace: "learn" });

  // The myths section is the one part of this page that's naturally
  // Q&A-shaped — FAQPage schema for it, plus a plain Article entry for
  // the page as a whole. MYTH_KEYS/MYTH_SOURCES are shared with
  // LearnClient so this can never list a different set of myths than
  // what's actually rendered on the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: t("title"),
        description: t("metaDescription"),
        url: `${SITE_URL}/${locale}/learn`,
        inLanguage: locale,
      },
      {
        "@type": "FAQPage",
        mainEntity: MYTH_KEYS.map((key) => ({
          "@type": "Question",
          name: t(`myths.items.${key}.myth`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`myths.items.${key}.fact`),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Content is our own translated strings, not user input — escaping
        // "<" is still cheap insurance against a "</script>" breaking out
        // of the tag if a translation ever contained one.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <LearnClient />
    </>
  );
}
