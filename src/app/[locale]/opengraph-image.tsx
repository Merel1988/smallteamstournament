import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { EVENT } from "@/lib/event";

// Dynamic Open Graph / Twitter card image for all public pages under [locale].
export const alt = `${EVENT.name} — ${EVENT.league}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const svg = (await readFile(join(process.cwd(), "src/app/icon.svg"), "utf8"))
    .replace(/<style>.*?<\/style>/, "")
    .replaceAll('class="ink"', 'fill="#ffffff"');
  const logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

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
          color: "#ffffff",
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
            color: "#ffffff",
          }}
        >
          Small Teams
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 800,
            lineHeight: 1,
            color: "#e30613",
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
        <img
          src={logo}
          alt=""
          width={290}
          height={290}
          style={{ position: "absolute", right: 50, top: 170 }}
        />
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
