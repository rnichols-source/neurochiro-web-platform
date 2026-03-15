
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('doctors').select('id, verification_status');
  if (error) {
    console.error(error);
    return;
  }
  
  const stats: Record<string, number> = {};
  data?.forEach((d: any) => {
    stats[d.verification_status] = (stats[d.verification_status] || 0) + 1;
  });
  
  console.log('Total Doctors:', data?.length);
  console.log('Status Stats:', stats);
}
check();
