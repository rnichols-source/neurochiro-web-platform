
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("🧪 Testing search_doctors RPC...");
  
  const { data, error } = await supabase.rpc('search_doctors', {
    p_search_query: null,
    p_region_code: null,
    p_min_lng: null,
    p_min_lat: null,
    p_max_lng: null,
    p_max_lat: null,
    p_page: 1,
    p_limit: 100
  });

  if (error) {
    console.error("❌ RPC Error:", error);
    return;
  }

  console.log(`✅ Success! Found ${data?.length} doctors.`);
  if (data && data.length > 0) {
    console.log("Sample doctor:", {
      name: `${data[0].first_name} ${data[0].last_name}`,
      clinic: data[0].clinic_name,
      status: data[0].verification_status
    });
  }
}
test();
