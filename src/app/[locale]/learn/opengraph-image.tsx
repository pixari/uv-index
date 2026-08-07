import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Makes the /learn link itself look intentional in a chat/social preview,
// not just a bare title — the same gradient mark used by the app/PWA icons,
// plus the page's own title and description, hex-approximated from the
// design tokens (Satori's CSS support doesn't reliably cover oklch()).
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learn" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #3EA72D 0%, #FFF300 35%, #F18B00 65%, #E53210 100%)",
            }}
          />
          <span style={{ fontSize: 28, fontWeight: 600, color: "#111827" }}>UV Index</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
            {t("title")}
          </span>
          <span style={{ fontSize: 30, color: "#6b7280", maxWidth: 920, lineHeight: 1.4 }}>
            {t("metaDescription")}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
