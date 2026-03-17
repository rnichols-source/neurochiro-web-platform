import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function finalLiveTest() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log("🚀 STARTING FINAL LIVE TEST...");

  // 1. Search for ZIP 55128
  console.log("\n🔍 Test 1: Searching for ZIP '55128' (Stored in address)...");
  const { data: zipData, error: zipError } = await supabase
    .from('doctors')
    .select('first_name, last_name, address')
    .ilike('address', '%55128%')
    .eq('verification_status', 'verified');

  if (zipError) {
    console.error("❌ ZIP Search Error:", zipError.message);
  } else {
    console.log(`✅ Success! Found ${zipData?.length} doctors for ZIP 55128.`);
    zipData?.forEach(d => console.log(`   - ${d.first_name} ${d.last_name}: ${d.address}`));
  }

  // 2. Search for State 'Georgia'
  console.log("\n🔍 Test 2: Searching for State 'Georgia'...");
  const { data: gaData, error: gaError } = await supabase
    .from('doctors')
    .select('first_name, last_name, state')
    .ilike('state', '%Georgia%')
    .eq('verification_status', 'verified');

  if (gaError) {
    console.error("❌ Georgia Search Error:", gaError.message);
  } else {
    console.log(`✅ Success! Found ${gaData?.length} doctors in Georgia.`);
    gaData?.forEach(d => console.log(`   - ${d.first_name} ${d.last_name}`));
  }

  console.log("\n✨ FINAL VERIFICATION COMPLETE.");
}

finalLiveTest();
