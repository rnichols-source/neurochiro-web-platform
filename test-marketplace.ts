
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DOCTOR_ID = "5b3fd423-60a3-45f3-b3d3-cc39f84b3052";

async function runTest() {
  console.log("--- STARTING SEMINAR MARKETPLACE TEST ---");

  // 1. Ensure Host Profile exists
  console.log("\n1. Setting up Host Profile...");
  const { error: hostError } = await supabase.from('host_profiles').upsert({
    user_id: DOCTOR_ID,
    organization_name: "NeuroChiro Testing Lab",
    host_bio: "Expert in clinical system architecture testing.",
    host_type: "doctor",
    is_verified: true
  });
  if (hostError) console.error("Host Error:", hostError);
  else console.log("✅ Host Profile Ready.");

  // 2. Simulate Seminar Submission (as Doctor)
  console.log("\n2. Submitting New Seminar (Pending Approval)...");
  const { data: seminar, error: semError } = await supabase.from('seminars').insert({
    host_id: DOCTOR_ID,
    title: "TEST: Advanced Clinical Logic 101",
    description: "A masterclass in testing marketplace systems.",
    location: "Sydney, Australia",
    city: "Sydney",
    country: "Australia",
    dates: "Oct 24-25, 2026",
    registration_link: "https://neurochiro.co/test",
    listing_tier: "premium",
    target_audience: ["Doctors", "Students"],
    tags: ["Testing", "Logic"],
    is_approved: false, // Starts as false
    payment_status: "paid"
  }).select().single();

  if (semError) {
    console.error("Submission Error:", semError);
    return;
  }
  console.log(`✅ Seminar Submitted! ID: ${seminar.id}, Status: ${seminar.is_approved ? 'Live' : 'Pending Review'}`);

  // 3. Verify it's NOT in the public list yet
  console.log("\n3. Verifying Public Visibility (Should be Hidden)...");
  const { data: publicList } = await supabase.from('seminars').select('id').eq('is_approved', true).eq('id', seminar.id);
  if (publicList?.length === 0) console.log("✅ Correct: Seminar is hidden from public list.");
  else console.log("❌ Error: Seminar is visible before approval!");

  // 4. Admin Approval
  console.log("\n4. Approving Seminar (Simulating Admin)...");
  const { error: approveError } = await supabase.from('seminars').update({ is_approved: true }).eq('id', seminar.id);
  if (approveError) console.error("Approval Error:", approveError);
  else console.log("✅ Seminar Approved.");

  // 5. Verify it IS in the public list now
  console.log("\n5. Verifying Public Visibility (Should be Live)...");
  const { data: liveList } = await supabase.from('seminars').select('id, title, listing_tier').eq('is_approved', true).eq('id', seminar.id);
  if (liveList?.length === 1) console.log(`✅ Success: '${liveList[0].title}' is now LIVE with ${liveList[0].listing_tier} tier.`);
  else console.log("❌ Error: Seminar is still hidden!");

  // 6. Test Analytics
  console.log("\n6. Testing Analytics Tracking...");
  // Use the same names as the RPC in SQL
  const { error: viewError } = await supabase.rpc('increment_seminar_stats', { seminar_id: seminar.id, stat_column: 'page_views' });
  const { error: clickError } = await supabase.rpc('increment_seminar_stats', { seminar_id: seminar.id, stat_column: 'clicks' });
  
  if (viewError || clickError) console.error("Analytics Error:", viewError || clickError);

  const { data: stats } = await supabase.from('seminars').select('page_views, clicks').eq('id', seminar.id).single();
  console.log(`✅ Stats Tracked: Views: ${stats?.page_views}, Clicks: ${stats?.clicks}`);

  console.log("\n--- TEST COMPLETE ---");
  // Optional: Cleanup
  // await supabase.from('seminars').delete().eq('id', seminar.id);
}

runTest();
