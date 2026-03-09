import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function restoreDoctors() {
  console.log("🚀 STARTING RESTORATION OF ALL DOCTORS...");
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ MISSING ENVIRONMENT VARIABLES. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Get current count
    const { count: currentVisible } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');
    
    console.log(`📊 Current visible (verified) doctors: ${currentVisible}`);

    const { count: currentHidden } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'hidden');
    
    console.log(`📊 Current hidden doctors: ${currentHidden}`);

    // 2. Restore all to 'verified'
    console.log("⏳ Setting all doctors to 'verified' status...");
    const { error: updateError, count: updatedCount } = await supabase
      .from('doctors')
      .update({ verification_status: 'verified' })
      .neq('verification_status', 'verified'); // Update anything that isn't verified

    if (updateError) {
      throw updateError;
    }

    // 3. Confirm new count
    const { count: finalCount } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    console.log(`✅ RESTORATION COMPLETE.`);
    console.log(`📊 Total doctors now in system: ${finalCount}`);
    console.log(`✨ The list has been restored. No records were deleted.`);

  } catch (err: any) {
    console.error("❌ Restoration Error:", err.message);
  }
}

restoreDoctors();
