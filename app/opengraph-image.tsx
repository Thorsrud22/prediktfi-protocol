import { ImageResponse } from "next/og";
import { SITE } from "./config/site";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(1200px 600px at 20% 10%, oklab(from #6A1CE5 l a b / 0.22), transparent 60%)," +
            "radial-gradient(900px 500px at 80% 20%, oklab(from #1F4FE0 l a b / 0.18), transparent 65%)," +
            "linear-gradient(180deg, #0C2C66 0%, #0b1220 60%)",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          {SITE.name}
        </div>
      </div>
    ),
    size
  );
}
