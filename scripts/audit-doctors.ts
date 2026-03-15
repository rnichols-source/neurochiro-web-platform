
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log("🔍 Auditing Doctors table...");
  
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, email, clinic_name, slug, user_id');

  if (error) {
    console.error("Error fetching doctors:", error);
    return;
  }

  console.log(`Total doctors: ${doctors.length}`);

  const emptyNames = doctors.filter(d => !d.first_name || d.first_name.trim() === "");
  console.log(`\n❌ Doctors with empty first name: ${emptyNames.length}`);
  emptyNames.forEach(d => {
    console.log(`- ID: ${d.id}, Email: ${d.email}, Clinic: ${d.clinic_name}`);
  });

  const clinicCounts: Record<string, string[]> = {};
  doctors.forEach(d => {
    if (d.clinic_name) {
      const name = d.clinic_name.trim().toLowerCase();
      if (!clinicCounts[name]) clinicCounts[name] = [];
      clinicCounts[name].push(d.id);
    }
  });

  console.log("\n⚠️ Potential Duplicates (Same Clinic Name):");
  Object.entries(clinicCounts).forEach(([name, ids]) => {
    if (ids.length > 1) {
      console.log(`- Clinic: "${name}" (${ids.length} entries)`);
      ids.forEach(id => {
        const doc = doctors.find(d => d.id === id);
        console.log(`  * ID: ${id}, Name: ${doc?.first_name} ${doc?.last_name}, Email: ${doc?.email}`);
      });
    }
  });
}

audit();
