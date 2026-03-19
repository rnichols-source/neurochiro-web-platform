
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log("🔍 Debugging Doctor Slugs & IDs...");
  
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, slug, first_name, last_name, verification_status')
    .eq('verification_status', 'verified')
    .limit(10);

  if (error) {
    console.error("Error fetching doctors:", error);
    return;
  }

  console.log(`Verified doctors found: ${doctors.length}`);
  doctors.forEach(d => {
    console.log(`- Name: ${d.first_name} ${d.last_name}`);
    console.log(`  ID:   ${d.id}`);
    console.log(`  Slug: ${d.slug}`);
    console.log(`  URL Path: /directory/${d.slug || d.id}`);
  });
}

debug();
