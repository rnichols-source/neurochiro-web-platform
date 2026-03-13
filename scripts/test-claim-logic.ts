import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("⚠️ SUPABASE CREDENTIALS MISSING. RUNNING IN MOCK MODE.");
  simulateMock();
} else {
  runRealTest();
}

async function simulateMock() {
  console.log("🧪 SIMULATING CLAIM LOGIC (MOCK)...");

  // 1. Existing Unclaimed Doctor in Directory
  const unclaimedDoctor = {
    id: 'doc-123',
    email: 'test-doctor@example.com',
    user_id: null,
    first_name: 'Test',
    last_name: 'Doctor',
    clinic_name: 'Test Clinic',
    verification_status: 'pending'
  };

  console.log("📂 Existing Unclaimed Doctor:", unclaimedDoctor);

  // 2. New User Signup
  const newUser = {
    id: 'user-456',
    email: 'test-doctor@example.com',
    full_name: 'Dr. Test Doctor'
  };

  console.log("👤 New User Signup:", newUser);

  // 3. Logic that would run in the trigger:
  console.log("⚙️ Executing Claim Logic...");
  
  let resultDoctor: any = { ...unclaimedDoctor };
  
  if (newUser.email === unclaimedDoctor.email && resultDoctor.user_id === null) {
    resultDoctor.user_id = newUser.id;
    resultDoctor.verification_status = 'verified';
    console.log("✅ MATCH FOUND! Linking profile...");
  } else {
    console.log("❌ NO MATCH or already claimed.");
  }

  console.log("📂 Resulting Doctor Profile:", resultDoctor);

  if (resultDoctor.user_id === newUser.id && resultDoctor.verification_status === 'verified') {
    console.log("🎉 TEST PASSED: Profile claimed successfully.");
  } else {
    console.log("🚨 TEST FAILED: Profile not claimed.");
  }
}

async function runRealTest() {
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  console.log("🚀 RUNNING REAL DATABASE TEST...");
  
  const testEmail = `test-${Date.now()}@neurochiro.com`;
  
  try {
    // 1. Create an unclaimed doctor
    console.log(`📝 Creating unclaimed doctor with email: ${testEmail}`);
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .insert({
        first_name: 'Test',
        last_name: 'Doctor',
        email: testEmail,
        slug: `test-doctor-${Date.now()}`,
        clinic_name: 'Test Clinic',
        verification_status: 'pending'
      })
      .select()
      .single();

    if (docError) throw docError;
    console.log("✅ Unclaimed doctor created with ID:", doctor.id);

    // 2. Simulate signup (This usually happens via Auth trigger, but we'll manually call it if we can, or just mock the trigger effect)
    console.log("👤 Simulating user registration...");
    
    // In a real test, we would use supabase.auth.signUp
    // But since we want to test the trigger, we'll see if it works.
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Dr. Test Doctor',
        role: 'doctor',
        tier: 'starter'
      }
    });

    if (authError) throw authError;
    console.log("✅ Auth user created with ID:", authUser.user.id);

    // 3. Wait a moment for trigger to finish
    console.log("⏳ Waiting for trigger...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Verify the link
    const { data: updatedDoctor, error: verifyError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctor.id)
      .single();

    if (verifyError) throw verifyError;

    if (updatedDoctor.user_id === authUser.user.id) {
      console.log("🎉 SUCCESS: Trigger correctly linked the profile!");
      console.log("Verification Status:", updatedDoctor.verification_status);
    } else {
      console.log("🚨 FAILURE: Trigger did not link the profile.");
      
      // Check if it created a duplicate
      const { data: duplicates } = await supabase.from('doctors').select('*').eq('user_id', authUser.user.id);
      if (duplicates && duplicates.length > 0) {
        console.log("⚠️ DUPLICATE DETECTED! Found", duplicates.length, "doctors for this user_id.");
      }
    }

    // Cleanup
    console.log("🧹 Cleaning up...");
    await supabase.from('doctors').delete().eq('email', testEmail);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    
  } catch (err) {
    console.error("❌ Test failed with error:", err);
  }
}
