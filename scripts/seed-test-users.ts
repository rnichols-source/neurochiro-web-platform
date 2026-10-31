import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const seedPassword = process.env.SEED_PASSWORD;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!seedPassword) {
  console.error("Missing SEED_PASSWORD");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUsers() {
  const users = [
    { email: 'drray@neurochirodirectory.com', password: seedPassword, role: 'founder' },
    { email: 'doctor@test.com', password: seedPassword, role: 'doctor' },
    { email: 'student@test.com', password: seedPassword, role: 'student' },
  ];

  for (const user of users) {
    console.log("Seeding...", user.email);
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error && !error.message.includes('already registered')) {
      console.error("Error creating user:", user.email, error.message);
      continue;
    }

    let userId = data?.user?.id;
    if (!userId) {
       const { data: listData } = await supabase.auth.admin.listUsers();
       const existing = listData.users.find(u => u.email === user.email);
       userId = existing?.id;
    }

    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        role: user.role,
        email: user.email
      });
      console.log("Successfully seeded profile for:", user.email);
    }
  }
}

seedUsers();
