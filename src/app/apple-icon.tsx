import { ImageResponse } from "next/og";
import { BRAND_MARK_GRADIENT } from "@/lib/brandGradient";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: BRAND_MARK_GRADIENT,
          }}
        />
      </div>
    ),
    size,
  );
}
