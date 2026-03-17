const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gddapefwrmucimpdhjrz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGFwZWZ3cm11Y2ltcGRoanJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQyODYyNCwiZXhwIjoyMDg4MDA0NjI0fQ.AkSvGJgVFVGWEw4ZGjLSLsBVRI424g29D37kLyT_mjk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteKara() {
  const userId = '43e90b82-c53a-4a7b-8534-72b7fb9aa9fc';
  const email = 'drkara@handinhandchiro.com';
  const fullName = 'Kara Zuleg';
  const tempPassword = 'NeuroChiro2026!';

  console.log(`Promoting ${fullName} (${email}) to PRO Doctor...`);

  // 1. Update Auth Password
  const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: tempPassword }
  );

  if (authError) {
    console.error("Error updating auth password:", authError.message);
  } else {
    console.log("✅ Password set to:", tempPassword);
  }

  // 2. Update Profile Role & Tier
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      role: 'doctor', 
      tier: 'pro',
      full_name: fullName
    })
    .eq('id', userId);

  if (profileError) {
    console.error("Error updating profile:", profileError.message);
  } else {
    console.log("✅ Profile promoted to PRO Doctor.");
  }

  // 3. Link Existing Doctor Record
  const { error: doctorError } = await supabase
    .from('doctors')
    .update({
      user_id: userId,
      membership_tier: 'pro',
      verification_status: 'verified'
    })
    .eq('email', email);

  if (doctorError) {
    console.error("Error linking doctor record:", doctorError.message);
  } else {
    console.log("✅ Doctor clinical record linked and upgraded.");
  }

  console.log("\n--------------------------------------------------");
  console.log(`Login Email: ${email}`);
  console.log(`Password: ${tempPassword}`);
  console.log("--------------------------------------------------");
}

promoteKara();
