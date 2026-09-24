/**
 * Rollback city/state migration.
 * Run with: npx tsx scripts/rollback-city-state.ts
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function rollback() {
  const backup = JSON.parse(
    readFileSync(resolve(__dirname, 'city-state-backup-2026-09-23.json'), 'utf8')
  );

  console.log(`Rolling back ${backup.length} records...`);
  let updated = 0;

  for (const doc of backup) {
    const { error } = await (supabase as any)
      .from('doctors')
      .update({ city: doc.city, state: doc.state })
      .eq('id', doc.id);

    if (error) {
      console.error(`Failed: ${doc.first_name} ${doc.last_name}: ${error.message}`);
    } else {
      updated++;
    }
  }

  console.log(`Rolled back ${updated}/${backup.length} records.`);
}

rollback();
