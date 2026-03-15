
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function mergeDoctors() {
  console.log("🚀 Starting Intelligent Doctor Merge & Cleanup...");
  
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('*');

  if (error) {
    console.error("Error fetching doctors:", error);
    return;
  }

  const clinicGroups: Record<string, any[]> = {};
  doctors.forEach(d => {
    const key = (d.clinic_name || 'no-clinic').trim().toLowerCase();
    if (!clinicGroups[key]) clinicGroups[key] = [];
    clinicGroups[key].push(d);
  });

  let mergedCount = 0;
  let deletedCount = 0;

  for (const [clinic, docs] of Object.entries(clinicGroups)) {
    if (docs.length <= 1 || clinic === 'no-clinic') continue;

    // Find the "Best" doctor (has the most complete name)
    const sorted = [...docs].sort((a, b) => {
      const nameA = ((a.first_name || '') + (a.last_name || '')).length;
      const nameB = ((b.first_name || '') + (b.last_name || '')).length;
      return nameB - nameA;
    });

    const best = sorted[0];
    const duplicates = sorted.slice(1);

    if (((best.first_name || '') + (best.last_name || '')).length === 0) {
      console.log(`⚠️ Clinic "${clinic}" has multiple entries but NONE have names. Skipping merge, will be handled by empty purge.`);
      continue;
    }

    console.log(`\n💎 Best record for "${best.clinic_name}": ${best.first_name} ${best.last_name} (${best.id})`);

    const updates: any = {};
    const fieldsToMerge = ['email', 'bio', 'website_url', 'instagram_url', 'facebook_url', 'photo_url', 'address', 'city', 'state', 'zip_code', 'latitude', 'longitude'];

    for (const dupe of duplicates) {
      console.log(`  - Merging duplicate: ${dupe.id} (Name: "${dupe.first_name} ${dupe.last_name}")`);
      
      fieldsToMerge.forEach(field => {
        if (!best[field] && dupe[field]) {
          updates[field] = dupe[field];
          best[field] = dupe[field]; // Update local copy for subsequent merges
        }
      });

      // Delete the duplicate
      const { error: delError } = await supabase.from('doctors').delete().eq('id', dupe.id);
      if (delError) console.error(`    ❌ Failed to delete dupe ${dupe.id}:`, delError.message);
      else deletedCount++;
    }

    if (Object.keys(updates).length > 0) {
      const { error: upError } = await supabase.from('doctors').update(updates).eq('id', best.id);
      if (upError) console.error(`  ❌ Failed to update best record ${best.id}:`, upError.message);
      else {
        console.log(`  ✅ Updated best record with merged data.`);
        mergedCount++;
      }
    }
  }

  // Final purge of any remaining doctors with no first name
  console.log("\n🧹 Final purge of any remaining empty-name records...");
  const { data: leftovers } = await supabase.from('doctors').select('id').or('first_name.is.null,first_name.eq.""');
  if (leftovers && leftovers.length > 0) {
    console.log(`  - Found ${leftovers.length} empty-name records. Purging...`);
    for (const doc of leftovers) {
      await supabase.from('doctors').delete().eq('id', doc.id);
      deletedCount++;
    }
  }

  console.log(`\n🎉 DONE!`);
  console.log(`- Best records updated: ${mergedCount}`);
  console.log(`- Duplicate/Empty records removed: ${deletedCount}`);
}

mergeDoctors();
