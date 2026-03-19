
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNames() {
  console.log("🛠️ Fixing missing doctor names...");
  
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, email')
    .or('first_name.is.null,first_name.eq.""');

  if (error) {
    console.error("Error fetching doctors:", error);
    return;
  }

  if (!doctors || doctors.length === 0) {
    console.log("✅ No doctors with missing first names found.");
    return;
  }

  console.log(`Found ${doctors.length} doctors with missing names. Updating...`);

  for (const doc of doctors) {
    const { error: updateError } = await supabase
      .from('doctors')
      .update({ first_name: 'Neuro-Chiro' , last_name: doc.last_name || 'Specialist' })
      .eq('id', doc.id);

    if (updateError) {
      console.error(`Failed to update doctor ${doc.id}:`, updateError);
    } else {
      console.log(`Updated doctor ${doc.id} (${doc.email})`);
    }
  }

  console.log("✨ Name cleanup complete.");
}

fixNames();
