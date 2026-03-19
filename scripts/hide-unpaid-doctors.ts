import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const doctorNames = [
  'Ronnie Bolar', 'Dr. Stanton Hom', 'Dr. Todd Countee', 'Dr. Zachary Soufl', 
  'Jake Schumann', 'Kyle Rodriguez', 'Mickey Mondragon', 'Dr. KenGee Ehrlich', 
  'Dr. Kevin LeBlanc', 'Dr. Kurtis Fischer', 'Dr. Maggie Benham', 'Dr. Megan Gomez', 
  'Dr. Preston Cook', 'Dr. Brooke Galbiati', 'Dr. Elle Klink', 'Dr. James Huang', 
  'Blain Segura', 'Chandler Boggs', 'Canaan Andrews', 'Dr. Alexis Taylor', 
  'Dr. Ashley Trueblood', 'Dr. Breanna Rodriguez', 'Amy Anthony'
];

async function hideDoctors() {
  console.log("🚀 STARTING REMOVAL OF UNPAID DOCTORS...");
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // DEBUG: Fetch first 10 doctors to see format
    const { data: sampleDocs } = await supabase.from('doctors').select('first_name, last_name').limit(10);
    console.log("DEBUG: Sample doctors in DB:", sampleDocs);

    let totalUpdated = 0;

    for (const fullName of doctorNames) {
      const parts = fullName.replace('Dr. ', '').split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');

      const { error: updateError, count: updatedCount } = await supabase
        .from('doctors')
        .update({ verification_status: 'hidden' })
        .ilike('first_name', `%${firstName}%`)
        .ilike('last_name', `%${lastName}%`);

      if (!updateError) {
        totalUpdated += (updatedCount || 0);
      }
    }

    console.log(`✅ Successfully hidden ${totalUpdated} listings from the directory.`);
  } catch (err: any) {
    console.error("❌ Database Error:", err.message);
  }
}

hideDoctors();
