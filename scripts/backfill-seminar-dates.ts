/**
 * Print parsed seminar dates. Does not write.
 * Run: node --experimental-strip-types --env-file=.env.local scripts/backfill-seminar-dates.ts
 * --write is refused. --geocode prints a Nominatim preview and still does not write.
 */
import { createClient } from "@supabase/supabase-js";
import { parseSeminarDates, timezoneForCity, zonedIso } from "../src/lib/seminars/dates.ts";
import { seminarSlug } from "../src/lib/seminars/slug.ts";
import { countryCode } from "../src/lib/seminars/format.ts";

if (process.argv.includes("--write")) {
  console.error("Writes are disabled. Review the printed SQL, then apply it yourself after approval.");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.from("seminars").select("id, title, dates, city, country, is_past, is_approved").limit(200);
if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("Parsed seminar dates. No rows were updated.\n");
for (const row of data || []) {
  const parsed = parseSeminarDates(row.dates);
  const zone = timezoneForCity(row.city, row.country);
  const slug = seminarSlug(row.title, row.city, parsed?.year || null);
  console.log([
    row.id,
    row.is_approved ? "approved" : "hidden",
    row.title,
    row.dates,
    parsed ? `${parsed.start} -> ${parsed.end}` : "UNPARSED",
    zone,
    countryCode(row.country),
    slug,
  ].join(" | "));
  if (parsed) {
    const start = zonedIso(parsed.start, "09:00", zone);
    const end = zonedIso(parsed.end, "17:00", zone);
    console.log(`  -- proposed, not executed: update public.seminars set starts_at = '${start}', ends_at = '${end}', timezone = '${zone}' where id = '${row.id}' and starts_at is null;`);
  }
}

if (process.argv.includes("--geocode")) {
  console.log("\nGeocode preview. No coordinates were written.");
  for (const row of data || []) {
    const query = [row.city, row.country].filter(Boolean).join(", ");
    if (!query) continue;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "NeuroChiroSeminarPreview/1.0 (seminars@neurochiro.co)" },
    });
    const json = await response.json();
    const hit = json?.[0];
    console.log(`${row.id} | ${query} | ${hit ? `${hit.lat},${hit.lon}` : "no hit"}`);
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
}
