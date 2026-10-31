import { ImageResponse } from "@vercel/og";
import { parseSeminarDates, timezoneForCity } from "@/lib/seminars/dates";
import { countryCode, currencyForCountry, formatDateRange, priceLabel } from "@/lib/seminars/format";
import { isUuid, seminarSlug } from "@/lib/seminars/slug";

export const runtime = "edge";

const PUBLIC_COLUMNS = "id,title,dates,city,country,price,ce_hours,is_approved,image_url,hero_image_url";

async function load(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const response = await fetch(`${url}/rest/v1/seminars?is_approved=eq.true&select=${PUBLIC_COLUMNS}&limit=200`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) return null;
  const rows = await response.json() as Record<string, string | number | null>[];
  return rows.find((row) => {
    const parsed = parseSeminarDates(String(row.dates || ""));
    const computed = seminarSlug(String(row.title || ""), String(row.city || ""), parsed?.year || null);
    return computed === slug || (isUuid(slug) && row.id === slug);
  }) || null;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const seminar = await load(slug);
  if (!seminar) return new Response("Seminar not found", { status: 404 });
  const format = new URL(request.url).searchParams.get("format") || "og";
  const size = format === "story" ? { width: 1080, height: 1920 } : format === "square" ? { width: 1080, height: 1080 } : { width: 1200, height: 630 };
  const parsed = parseSeminarDates(String(seminar.dates || ""));
  const zone = timezoneForCity(String(seminar.city || ""), String(seminar.country || ""));
  const when = formatDateRange(parsed?.start || null, parsed?.end || null, zone, String(seminar.dates || ""));
  const code = countryCode(String(seminar.country || ""));
  const price = priceLabel({ price: seminar.price == null ? null : Number(seminar.price), currency: currencyForCountry(String(seminar.country || "")), country: code });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#1E2D3B", color: "white", padding: 64 }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, color: "#D66829" }}>NEUROCHIRO.CO</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: format === "story" ? 72 : 56, fontWeight: 800, lineHeight: 1.05 }}>{String(seminar.title || "Seminar")}</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 32 }}>{when}{seminar.city ? ` · ${seminar.city}` : ""} {code}</div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 28, color: "#D66829" }}>{price}{seminar.ce_hours ? ` · ${seminar.ce_hours} CE` : ""}</div>
        </div>
      </div>
    ),
    size,
  );
}
