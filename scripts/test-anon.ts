import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function testAnonAccess() {
  console.log("Testing access with ANON KEY...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error, count } = await supabase
    .from('doctors')
    .select('*', { count: 'exact' })
    .eq('verification_status', 'verified');
  
  if (error) {
    console.error("Anon Access Error:", error);
  } else {
    console.log(`Anon Access Success! Found ${count} verified doctors.`);
    if (data && data.length > 0) {
      console.log("First doctor:", data[0].first_name, data[0].last_name);
    }
  }
}

testAnonAccess();
