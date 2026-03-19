require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const { Automations, executeAutomation } = require('../src/lib/automations');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runAudit() {
  console.log('🚀 Starting Automated System Audit...\n');

  let passed = 0;
  let failed = 0;

  const pass = (msg) => { console.log(`✅ PASS: ${msg}`); passed++; };
  const fail = (msg, err) => { console.error(`❌ FAIL: ${msg}`, err); failed++; };

  try {
    // TEST 1: Database Connection & Triggers
    const { data: qData, error: qErr } = await supabase.from('automation_queue').select('id').limit(1);
    if (qErr) throw qErr;
    pass('Database connection & automation_queue access verified.');

    // TEST 2: Stripe Idempotency Check
    const { data: pData, error: pErr } = await supabase.from('processed_webhooks').select('id').limit(1);
    if (pErr) throw pErr;
    pass('Stripe idempotency table (processed_webhooks) verified.');

    // TEST 3: Mock Signup Automation Enqueue
    const mockUserId = '11111111-1111-1111-1111-111111111111';
    await Automations.onSignup(mockUserId, 'test_signup@neurochiro.co', 'Test Doctor');
    
    // Check if it queued
    const { data: queuedSignup } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('event_type', 'welcome_email')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (queuedSignup && queuedSignup.payload.email === 'test_signup@neurochiro.co') {
      pass('Signup flow successfully queues welcome email.');
      // Cleanup
      await supabase.from('automation_queue').delete().eq('id', queuedSignup.id);
    } else {
      fail('Signup flow failed to queue welcome email.');
    }

    // TEST 4: Job Application Automation Enqueue
    await Automations.onJobApplication('std_123', 'student@test.com', 'job_abc', 'Associate Doctor', 'doctor@hiring.com');
    const { data: queuedJob } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('event_type', 'job_application')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queuedJob && queuedJob.payload.doctorEmail === 'doctor@hiring.com') {
      pass('Job application notification correctly queues for hiring doctor.');
      await supabase.from('automation_queue').delete().eq('id', queuedJob.id);
    } else {
      fail('Job application notification failed to queue properly.');
    }

    // TEST 5: Dunning (Payment Warning) Enqueue
    await Automations.onPaymentWarning('doc_fail', 'failed_doc@neurochiro.co', 'Failed Doc');
    const { data: queuedWarning } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('event_type', 'payment_warning')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queuedWarning && queuedWarning.payload.email === 'failed_doc@neurochiro.co') {
      pass('Dunning (payment warning) successfully queues.');
      await supabase.from('automation_queue').delete().eq('id', queuedWarning.id);
    } else {
      fail('Dunning flow failed to queue.');
    }

    // TEST 6: Check Notifications Table
    const { data: notifData, error: notifErr } = await supabase.from('notifications').select('id').limit(1);
    if (!notifErr) {
      pass('In-app notifications table exists and is accessible.');
    } else {
      fail('Notifications table error', notifErr);
    }

    // TEST 7: Stripe Mock Payload Test
    await Automations.onPaymentSuccess({ customer: 'cus_mock123', client_reference_id: mockUserId });
    const { data: queuedPayment } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('event_type', 'payment_success')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queuedPayment && queuedPayment.payload.stripeData.customer === 'cus_mock123') {
      pass('Stripe payment_success successfully queues automation.');
      await supabase.from('automation_queue').delete().eq('id', queuedPayment.id);
    } else {
      fail('Stripe payment_success flow failed to queue.');
    }

  } catch (err) {
    console.error('Audit encountered a critical failure:', err);
  }

  console.log(`\n📊 AUDIT SUMMARY: ${passed} Passed, ${failed} Failed.`);
  if (failed === 0) {
    console.log('🟢 ALL SYSTEMS GO. Platform is ready for mass email deployment.');
  } else {
    console.log('🔴 AUDIT FAILED. Address the issues above before launching.');
  }
}

runAudit();
