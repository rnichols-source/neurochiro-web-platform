import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function checkDatabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log("MOCK_MODE: Environment variables not found. Checking MOCK_DOCTORS count.");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { count: total } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
  const { count: verified } = await supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified');
  const { count: hidden } = await supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'hidden');

  console.log(`DATABASE_STATS: Total=${total}, Verified=${verified}, Hidden=${hidden}`);
}

checkDatabase();
