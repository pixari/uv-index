import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { loadFrauncesFonts } from "@/lib/ogFonts";
import { HomeOgCard } from "./ogCard";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Home's own reading is personal (device location, live UV) and can't be
// rendered into a static social-preview image — this shows the app's
// identity and pitch instead, so a shared link doesn't show up as a bare,
// imageless title in a chat/social preview.
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const fonts = await loadFrauncesFonts();

  return new ImageResponse(<HomeOgCard title={t("title")} description={t("description")} />, {
    ...size,
    fonts,
  });
}
