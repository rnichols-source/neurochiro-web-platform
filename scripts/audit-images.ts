
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditImages() {
  console.log("📸 Auditing doctor profile images...");
  
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, photo_url, clinic_name')
    .eq('verification_status', 'verified');

  if (error) {
    console.error("Error fetching doctors:", error);
    return;
  }

  const missingPhotos = doctors.filter(d => !d.photo_url || d.photo_url === "" || d.photo_url.includes('example.com'));
  
  if (missingPhotos.length === 0) {
    console.log("✅ All verified doctors have profile images.");
  } else {
    console.log(`⚠️ Found ${missingPhotos.length} doctors with missing or placeholder images.`);
    missingPhotos.forEach(d => {
      console.log(`  - ID: ${d.id}, Name: ${d.first_name} ${d.last_name}, URL: ${d.photo_url || 'NULL'}`);
    });
  }

  console.log("\n✨ Audit complete. Frontend fallbacks will handle these cases.");
}

auditImages();
