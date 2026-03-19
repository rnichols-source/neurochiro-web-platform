require('dotenv').config({ path: '../.env' });
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Setup Clients
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Needs service role to bypass RLS
);

const REMINDER_INTERVAL_DAYS = 3; // Send every 3 days

async function runReminderEngine() {
  console.log('🔄 Starting Onboarding Reminder Engine...');

  // 2. Fetch users who:
  // - Are Doctors
  // - Have NOT completed onboarding
  // - Were created at least 3 days ago
  // - Haven't received a reminder in the last 3 days
  const { data: slackers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at, last_reminder_sent_at, onboarding_status')
    .eq('role', 'doctor')
    .neq('onboarding_status', 'completed')
    .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${new Date(Date.now() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString()}`);

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  console.log(`📊 Found ${slackers.length} doctors needing a reminder.`);

  for (const doctor of slackers) {
    try {
      console.log(`📤 Sending reminder to: ${doctor.email}`);

      // 3. Send the Email
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: [doctor.email],
        subject: 'Action Required: Complete Your NeuroChiro Profile',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
            <div style="background: #0B1118; padding: 40px; text-align: center;">
              <img src="https://neurochiro.co/logo-white.png" width="120">
            </div>
            <div style="padding: 40px;">
              <h2>Hi Dr. ${doctor.full_name || 'Doctor'},</h2>
              <p>Your clinic profile is currently **inactive** and hidden from the global directory.</p>
              <p>To start receiving patient referrals and accessing your member tools, you must complete your profile setup.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://neurochiro.co/doctor/profile" style="background: #D66829; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Complete My Profile</a>
              </div>
              <p style="font-size: 13px; color: #666;">This is an automated reminder. Once your profile is 100% complete, these emails will stop.</p>
            </div>
          </div>
        `
      });

      // 4. Update the DB so we don't nag them again too soon
      await supabase
        .from('profiles')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('id', doctor.id);

    } catch (err) {
      console.error(`❌ Failed to process ${doctor.email}:`, err);
    }
  }

  console.log('✅ Reminder run complete.');
}

runReminderEngine().catch(console.error);
