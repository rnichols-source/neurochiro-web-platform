import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function createSebastianAccount() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const email = 'sebastian@neurochiro.com.au';
  const fullName = 'Sebastian';

  const { data: { users } } = await supabase.auth.admin.listUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    console.log("Creating new auth user...");
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'NeuroChiroAU2026!',
        email_confirm: true,
        user_metadata: { full_name: fullName }
    });
    if (error) return console.error(error);
    user = data.user;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: email,
    full_name: fullName,
    role: 'regional_admin:AU'
  });

  if (error) console.error(error);
  else console.log("✅ Sebastian setup complete with role regional_admin:AU");
}
createSebastianAccount();
