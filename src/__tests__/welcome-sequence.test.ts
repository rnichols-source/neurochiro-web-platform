/**
 * Welcome Sequence Tests
 *
 * These are integration-style tests that verify the sequence logic
 * against the real Supabase database. Run with:
 *   npx tsx src/__tests__/welcome-sequence.test.ts
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   RESEND_MARKETING_API_KEY, RESEND_MARKETING_FROM, NEUROCHIRO_MAILING_ADDRESS,
 *   RESEND_AUDIENCE_ID
 */

import { createClient } from '@supabase/supabase-js';
import { sendWelcomeStep, WELCOME_STEPS } from '../lib/welcome-sequence';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEST_EMAIL = `test-sequence-${Date.now()}@test.neurochiro.co`;
let testSubscriberId: string;

async function setup() {
  // Create a confirmed test subscriber
  const { data, error } = await (supabase as any)
    .from('subscribers')
    .insert({
      email: TEST_EMAIL,
      zip: '29651',
      state: 'SC',
      status: 'confirmed',
      confirmed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      source: 'test',
      ip: '127.0.0.1',
      user_agent: 'test-runner',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Setup failed: ${error.message}`);
  testSubscriberId = data.id;
  console.log(`✓ Created test subscriber: ${TEST_EMAIL} (${testSubscriberId})`);
}

async function cleanup() {
  await (supabase as any).from('sequence_state').delete().eq('subscriber_id', testSubscriberId);
  await (supabase as any).from('subscribers').delete().eq('id', testSubscriberId);
  console.log(`✓ Cleaned up test subscriber`);
}

async function testIdempotency() {
  console.log('\n--- Test: Idempotency ---');
  const step = WELCOME_STEPS[0]; // step 0

  // First send (dry run to avoid actually emailing)
  const result1 = await sendWelcomeStep(supabase, testSubscriberId, TEST_EMAIL, step, true);
  // Dry run rolls back, so we need to do a real insert to test idempotency
  await (supabase as any).from('sequence_state').insert({
    subscriber_id: testSubscriberId,
    step: step.step,
  });

  // Second attempt should be blocked by unique constraint
  const result2 = await sendWelcomeStep(supabase, testSubscriberId, TEST_EMAIL, step, true);

  if (result2.error === 'already_sent') {
    console.log('✓ Second send correctly blocked (idempotent)');
  } else {
    console.error('✗ FAIL: Second send was NOT blocked:', result2);
    process.exit(1);
  }
}

async function testUnsubscribeExclusion() {
  console.log('\n--- Test: Unsubscribe Exclusion ---');

  // Mark subscriber as unsubscribed
  await (supabase as any)
    .from('subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', testSubscriberId);

  // Query the way the cron does
  const { data } = await (supabase as any)
    .from('subscribers')
    .select('id')
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null)
    .eq('id', testSubscriberId);

  if (!data || data.length === 0) {
    console.log('✓ Unsubscribed subscriber correctly excluded from query');
  } else {
    console.error('✗ FAIL: Unsubscribed subscriber was NOT excluded');
    process.exit(1);
  }

  // Reset for next test
  await (supabase as any)
    .from('subscribers')
    .update({ unsubscribed_at: null })
    .eq('id', testSubscriberId);
}

async function testStepOrdering() {
  console.log('\n--- Test: Step Ordering ---');

  // Clear all sequence state
  await (supabase as any).from('sequence_state').delete().eq('subscriber_id', testSubscriberId);

  // Subscriber confirmed 8 days ago, so all 3 steps should be eligible
  const confirmedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysSince = (now.getTime() - confirmedAt.getTime()) / (1000 * 60 * 60 * 24);

  const eligibleSteps = WELCOME_STEPS.filter(s => daysSince >= s.dayOffset);

  if (eligibleSteps.length === 3) {
    console.log('✓ All 3 steps eligible for 8-day-old subscriber');
  } else {
    console.error(`✗ FAIL: Expected 3 eligible steps, got ${eligibleSteps.length}`);
    process.exit(1);
  }

  // Verify step order is correct
  if (eligibleSteps[0].dayOffset === 0 && eligibleSteps[1].dayOffset === 3 && eligibleSteps[2].dayOffset === 7) {
    console.log('✓ Steps in correct order: day 0, day 3, day 7');
  } else {
    console.error('✗ FAIL: Steps not in expected order');
    process.exit(1);
  }

  // Verify a 2-day-old subscriber only gets step 0
  const twoDaySteps = WELCOME_STEPS.filter(s => 2 >= s.dayOffset);
  if (twoDaySteps.length === 1 && twoDaySteps[0].step === 0) {
    console.log('✓ 2-day subscriber only eligible for step 0');
  } else {
    console.error('✗ FAIL: 2-day subscriber got wrong steps');
    process.exit(1);
  }

  // Verify a 5-day-old subscriber gets steps 0 and 1
  const fiveDaySteps = WELCOME_STEPS.filter(s => 5 >= s.dayOffset);
  if (fiveDaySteps.length === 2) {
    console.log('✓ 5-day subscriber eligible for steps 0 and 1');
  } else {
    console.error('✗ FAIL: 5-day subscriber got wrong steps');
    process.exit(1);
  }
}

async function run() {
  console.log('=== Welcome Sequence Tests ===\n');

  try {
    await setup();
    await testIdempotency();
    await testUnsubscribeExclusion();
    await testStepOrdering();
    console.log('\n=== All tests passed ===');
  } catch (err) {
    console.error('\n=== TEST ERROR ===', err);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

run();
