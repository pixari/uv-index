import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { BRAND_MARK_GRADIENT } from "@/lib/brandGradient";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }, { size: "512-maskable" }];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const maskable = size.endsWith("-maskable");
  const px = parseInt(size, 10);

  // Maskable icons need a safe zone: the visual mark should sit inside
  // the inner ~80% of the canvas since OS UIs may crop/mask the edges.
  const markScale = maskable ? 0.6 : 0.72;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: maskable ? "#fff" : "transparent",
        }}
      >
        <div
          style={{
            width: px * markScale,
            height: px * markScale,
            borderRadius: "50%",
            background: BRAND_MARK_GRADIENT,
          }}
        />
      </div>
    ),
    { width: px, height: px },
  );
}
