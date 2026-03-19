import { Automations } from '../src/lib/automations';

async function testAutomations() {
  console.log("🧪 STARTING AUTOMATION UNIT TEST...");

  // 1. Test Payment Success
  console.log("\n--- Testing: onPaymentSuccess (Doctor Membership) ---");
  await Automations.onPaymentSuccess({
    customer_details: { email: 'doctor-test@example.com' },
    metadata: {
      userId: 'dr_abc_123',
      planId: 'price_doctor_membership_monthly'
    }
  });

  // 2. Test Payment Failure
  console.log("\n--- Testing: onPaymentFailed ---");
  await Automations.onPaymentFailed({
    metadata: { userId: 'dr_abc_123' }
  });

  // 3. Test Referral
  console.log("\n--- Testing: onReferralSent ---");
  await Automations.onReferralSent(
    'referrer_1', 
    'Dr. Referrer', 
    'doctor_2', 
    'doctor2@example.com', 
    '555-555-5555', 
    'Jane Doe'
  );

  console.log("\n✅ AUTOMATION UNIT TEST COMPLETE.");
}

testAutomations().catch(console.error);
