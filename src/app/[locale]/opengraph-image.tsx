import { ImageResponse } from "next/og";
import { EVENT } from "@/lib/event";

// Dynamic Open Graph / Twitter card image for all public pages under [locale].
export const alt = `${EVENT.name} — ${EVENT.league}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#141414",
          color: "#ffd400",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>
          {EVENT.league}
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 800,
            lineHeight: 1,
            marginTop: 12,
            color: "#ffd400",
          }}
        >
          Small Teams
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 800,
            lineHeight: 1,
            color: "#ffd400",
          }}
        >
          Tournament
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 44,
            color: "#ffffff",
          }}
        >
          21 november 2026 · {EVENT.city}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 24,
            background: "#e30613",
          }}
        />
      </div>
    ),
    size,
  );
}
