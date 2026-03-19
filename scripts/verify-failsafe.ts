import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function verifyFailsafe() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log("1. Updating test doctor to Georgia...");
  const { error: updateError } = await supabase
    .from('doctors')
    .update({ state: 'Georgia', region_code: 'US' })
    .eq('first_name', 'Dylan'); // Using Dylan Jones as test

  if (updateError) {
    console.error("Update Error:", updateError);
    return;
  }
  console.log("✅ Update Successful.");

  console.log("2. Triggering Index Refresh...");
  const { error: rpcError } = await supabase.rpc('refresh_search_index');
  if (rpcError) {
    console.warn("RPC Error (might not exist yet):", rpcError.message);
  } else {
    console.log("✅ Index Refreshed.");
  }

  console.log("3. Testing Search for 'Georgia'...");
  // Simulate API logic
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .or('first_name.ilike.%Georgia%,last_name.ilike.%Georgia%,clinic_name.ilike.%Georgia%,region_code.ilike.%Georgia%,state.ilike.%Georgia%')
    .eq('verification_status', 'verified');

  if (error) {
    console.error("Search Error:", error);
  } else {
    console.log(`✅ Search Success! Found ${data?.length} doctors.`);
    const dylan = data?.find(d => d.first_name === 'Dylan');
    if (dylan) {
      console.log(`✨ Verified: Dylan Jones is found in the 'Georgia' search results.`);
    }
  }
}

verifyFailsafe();
