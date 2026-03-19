
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, clinic_name, latitude, longitude')
    .eq('verification_status', 'verified');
    
  if (error) {
    console.error(error);
    return;
  }
  
  const withCoords = data?.filter(d => d.latitude && d.longitude && d.latitude !== 0 && d.longitude !== 0) || [];
  
  console.log('Total Verified:', data?.length);
  console.log('With Valid Coords:', withCoords.length);
  
  if (withCoords.length > 0) {
    console.log('Sample Coords:', withCoords.slice(0, 5));
  }
}
check();
