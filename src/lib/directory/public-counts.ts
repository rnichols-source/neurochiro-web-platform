import { createAdminClient } from "@/lib/supabase-admin";
import { EUROPEAN_ISO, countryMeta, toDirectoryCountry } from "@/lib/directory-countries";
import { isValidCoord } from "@/lib/geo";
import type { RegionCode } from "@/lib/regions";
import { excludeDemo } from "@/lib/directory/exclude-demo";

export interface PublicDirectoryCounts {
  total: number;
  countries: number;
  byCountry: Record<RegionCode, number>;
}

const EMPTY: PublicDirectoryCounts = {
  total: 0,
  countries: 0,
  byCountry: { US: 0, AU: 0, CA: 0, UK: 0, NZ: 0, EU: 0, ALL: 0 },
};

/**
 * Same rows the country chip counts: verified or pending, real coordinates, demo slugs removed.
 * `/api/directory/countries` uses this so the homepage pill cannot drift from the switcher.
 */
export async function getPublicDirectoryCounts(): Promise<PublicDirectoryCounts> {
  try {
    const supabase = createAdminClient();
    const { data } = await excludeDemo(
      supabase
        .from("doctors")
        .select("country, latitude, longitude")
        .in("verification_status", ["verified", "pending"])
    );
    const rows = (data || []).filter((row) => isValidCoord(row.latitude, row.longitude));
    const byCountry: Record<RegionCode, number> = { ...EMPTY.byCountry };
    const isos = new Set<string>();
    for (const row of rows) {
      const iso = String(row.country || "US").toUpperCase();
      isos.add(iso === "UK" ? "GB" : iso);
      const code = toDirectoryCountry(iso) as RegionCode;
      if (code in byCountry && code !== "ALL") byCountry[code] += 1;
      if (EUROPEAN_ISO.includes(iso)) byCountry.EU += 1;
      byCountry.ALL += 1;
    }
    return { total: byCountry.ALL, countries: isos.size, byCountry };
  } catch {
    return EMPTY;
  }
}

export function countryChipPayload(counts: PublicDirectoryCounts) {
  return (Object.entries(counts.byCountry) as [string, number][])
    .filter(([, count]) => count > 0)
    .map(([code, count]) => {
      const meta = countryMeta(code);
      return { code, label: meta.label, flag: meta.flag, count };
    })
    .sort((a, b) => b.count - a.count);
}
