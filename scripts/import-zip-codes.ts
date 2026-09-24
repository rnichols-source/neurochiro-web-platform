/**
 * Import GeoNames US postal codes into Supabase zip_codes table.
 *
 * Downloads, parses, dedupes to one row per ZIP (first/primary entry),
 * and upserts into the zip_codes table.
 *
 * Run with:
 *   npx tsx scripts/import-zip-codes.ts
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Source: GeoNames free gazetteer (geonames.org)
 * License: Creative Commons Attribution 4.0
 */

import { createClient } from '@supabase/supabase-js';

const GEONAMES_URL = 'https://download.geonames.org/export/zip/US.zip';

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Download the ZIP file
  console.log('Downloading GeoNames US postal codes...');
  const response = await fetch(GEONAMES_URL);
  if (!response.ok) {
    console.error('Download failed:', response.status);
    process.exit(1);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  // 2. Unzip and parse US.txt
  console.log('Extracting...');
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry('US.txt');
  if (!entry) {
    console.error('US.txt not found in archive');
    process.exit(1);
  }

  const text = entry.getData().toString('utf8');
  const lines = text.split('\n').filter(Boolean);
  console.log(`Parsed ${lines.length} rows`);

  // 3. Parse tab-separated: country, zip, place, state_name, state_code, ..., lat, lng, accuracy
  // Columns: 0=country, 1=zip, 2=place, 3=state_name, 4=state_code, 5=county, 6=county_code, 7=community, 8=community_code, 9=lat, 10=lng, 11=accuracy
  const seen = new Set<string>();
  const rows: { zip: string; city: string; state: string; lat: number; lng: number }[] = [];

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 11) continue;

    const zipCode = cols[1];
    if (!zipCode || zipCode.length !== 5 || seen.has(zipCode)) continue;
    seen.add(zipCode);

    const city = cols[2];
    const state = cols[4]; // 2-letter state code
    const lat = parseFloat(cols[9]);
    const lng = parseFloat(cols[10]);

    if (!city || !state || isNaN(lat) || isNaN(lng)) continue;

    rows.push({ zip: zipCode, city, state, lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 });
  }

  console.log(`Deduped to ${rows.length} unique ZIPs`);

  // 4. Upsert in batches of 500
  const BATCH_SIZE = 500;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await (supabase as any)
      .from('zip_codes')
      .upsert(batch, { onConflict: 'zip' });

    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
    } else {
      upserted += batch.length;
    }
  }

  console.log(`Done. Upserted ${upserted} ZIP codes.`);
}

run();
