import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function checkData() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.from('doctors').select('*').limit(5);
  
  if (error) {
    console.error("Error fetching data:", error);
    return;
  }
  
  console.log("Sample Data:");
  console.log(JSON.stringify(data, null, 2));
}

checkData();
