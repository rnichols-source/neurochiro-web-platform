
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, clinic_name, region_code')
    .eq('verification_status', 'verified');
    
  if (error) {
    console.error(error);
    return;
  }
  
  const stats: Record<string, number> = {};
  data?.forEach((d: any) => {
    const code = d.region_code || 'NULL';
    stats[code] = (stats[code] || 0) + 1;
  });
  
  console.log('Region Stats:', stats);
  if (stats['NULL']) {
    console.log('Example NULL region doctors:', data?.filter(d => !d.region_code).slice(0, 5));
  }
}
check();
