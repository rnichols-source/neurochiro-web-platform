import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPublicDirectoryCounts } from "@/lib/directory/public-counts";

export const runtime = "nodejs";
export const alt = "Find a nervous system chiropractor near you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/logo-white.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  let total = 0;
  try {
    total = (await getPublicDirectoryCounts()).total;
  } catch {
    total = 0;
  }
  const countLine = total > 0 ? `${total} verified doctors` : "Verified doctors";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#1E2D3B",
          color: "white",
          padding: "72px",
        }}
      >
        <img src={logoSrc} alt="" width={88} height={88} />
        <div style={{ display: "flex", marginTop: 36, fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
          Find a nervous system chiropractor near you
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#E8834A" }}>neurochiro.co</div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 28, color: "#D1D5DB" }}>{countLine}</div>
      </div>
    ),
    { ...size },
  );
}
