import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { loadFrauncesFonts } from "@/lib/ogFonts";
import { EditorialOgCard } from "../ogCard";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// /privacy previously had no image of its own at all — sharing it fell
// back to Home's, which also meant the whole card (title, description,
// URL) looked like a link to the homepage, not the privacy policy.
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const fonts = await loadFrauncesFonts();

  return new ImageResponse(
    (
      <EditorialOgCard
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("metaDescription")}
      />
    ),
    { ...size, fonts },
  );
}
