import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isUndefinedPaymentIssueColumn,
  planSubscriptionChange,
  resolveStripeStatus,
  type SubscriptionPlanInput,
} from './plan-subscription-change.ts';

const NOW = '2026-11-01T15:00:00.000Z';
const EARLIER = '2026-10-01T00:00:00.000Z';

function plan(overrides: Partial<SubscriptionPlanInput> & Pick<SubscriptionPlanInput, 'role' | 'stripeStatus'>): ReturnType<typeof planSubscriptionChange> {
  return planSubscriptionChange({
    hasOtherLiveMembership: false,
    paymentIssueSince: null,
    studentPastDueSince: null,
    now: NOW,
    ...overrides,
  });
}

const cases = [
  { status: 'active', tier: 'paid', flag: null },
  { status: 'trialing', tier: 'paid', flag: null },
  { status: 'past_due', tier: 'paid', flag: NOW },
  { status: 'incomplete', tier: 'unchanged', flag: null },
  { status: 'paused', tier: 'unchanged', flag: NOW },
  { status: 'canceled', tier: 'free', flag: null },
  { status: 'unpaid', tier: 'free', flag: null },
  { status: 'incomplete_expired', tier: 'free', flag: null },
] as const;

for (const role of ['doctor', 'student'] as const) {
  const paidTier = role === 'doctor' ? 'pro' : 'student_paid';
  for (const entry of cases) {
    test(`${role} ${entry.status}`, () => {
      const result = plan({
        role,
        stripeStatus: entry.status,
        paymentIssueSince: EARLIER,
        studentPastDueSince: EARLIER,
      });
      if (entry.tier === 'unchanged') {
        assert.equal('tier' in result.profiles, false);
        assert.equal(result.doctors, null);
      } else if (entry.tier === 'paid') {
        assert.equal(result.profiles.tier, paidTier);
        assert.equal(result.doctors?.membership_tier, role === 'doctor' ? 'pro' : undefined);
        if (role === 'student') assert.equal(result.doctors, null);
      } else {
        assert.equal(result.profiles.tier, 'free');
        if (role === 'doctor') assert.equal(result.doctors?.membership_tier, 'free');
        else assert.equal(result.doctors, null);
      }
      assert.equal(result.profiles.subscription_status, entry.status);
      if (entry.flag === NOW) {
        assert.equal(result.profiles.payment_issue_since, EARLIER);
      } else {
        assert.equal(result.profiles.payment_issue_since, null);
      }
      if (role === 'student') {
        assert.equal(result.profiles.student_past_due_since, entry.flag === NOW ? EARLIER : null);
      } else {
        assert.equal('student_past_due_since' in result.profiles, false);
      }
    });
  }
}

test('active to past_due stays paid and sets the flag', () => {
  const result = plan({ role: 'doctor', stripeStatus: 'past_due' });
  assert.equal(result.profiles.tier, 'pro');
  assert.equal(result.doctors?.membership_tier, 'pro');
  assert.equal(result.profiles.payment_issue_since, NOW);
});

test('past_due to active clears the flag', () => {
  const result = plan({ role: 'doctor', stripeStatus: 'active', paymentIssueSince: EARLIER });
  assert.equal(result.profiles.tier, 'pro');
  assert.equal(result.profiles.payment_issue_since, null);
});

test('trialing to active stays paid and clears the flag', () => {
  const result = plan({ role: 'student', stripeStatus: 'active', paymentIssueSince: EARLIER, studentPastDueSince: EARLIER });
  assert.equal(result.profiles.tier, 'student_paid');
  assert.equal(result.profiles.payment_issue_since, null);
  assert.equal(result.profiles.student_past_due_since, null);
});

test('past_due to unpaid is free and clears the flag', () => {
  const result = plan({ role: 'doctor', stripeStatus: 'unpaid', paymentIssueSince: EARLIER });
  assert.equal(result.profiles.tier, 'free');
  assert.equal(result.doctors?.membership_tier, 'free');
  assert.equal(result.profiles.payment_issue_since, null);
});

test('past_due to canceled is free and clears the flag', () => {
  const result = plan({ role: 'student', stripeStatus: 'canceled', paymentIssueSince: EARLIER, studentPastDueSince: EARLIER });
  assert.equal(result.profiles.tier, 'free');
  assert.equal(result.profiles.payment_issue_since, null);
  assert.equal(result.profiles.student_past_due_since, null);
  assert.equal(result.doctors, null);
});

test('active to canceled with another live membership stays paid', () => {
  const doctor = plan({ role: 'doctor', stripeStatus: 'canceled', hasOtherLiveMembership: true, paymentIssueSince: EARLIER });
  assert.equal(doctor.profiles.tier, 'pro');
  assert.equal(doctor.doctors?.membership_tier, 'pro');
  assert.equal(doctor.profiles.payment_issue_since, null);

  const student = plan({ role: 'student', stripeStatus: 'canceled', hasOtherLiveMembership: true });
  assert.equal(student.profiles.tier, 'student_paid');
  assert.equal(student.doctors, null);
});

test('incomplete to incomplete_expired is free', () => {
  const result = plan({ role: 'doctor', stripeStatus: 'incomplete_expired' });
  assert.equal(result.profiles.tier, 'free');
  assert.equal(result.doctors?.membership_tier, 'free');
  assert.equal(result.profiles.payment_issue_since, null);
});

test('incomplete to active grants paid access', () => {
  const result = plan({ role: 'student', stripeStatus: 'active' });
  assert.equal(result.profiles.tier, 'student_paid');
  assert.equal(result.profiles.payment_issue_since, null);
});

test('paused leaves the tier unchanged and sets the flag', () => {
  const doctor = plan({ role: 'doctor', stripeStatus: 'paused' });
  assert.equal('tier' in doctor.profiles, false);
  assert.equal(doctor.doctors, null);
  assert.equal(doctor.profiles.payment_issue_since, NOW);
  assert.equal(doctor.profiles.subscription_status, 'paused');

  const student = plan({ role: 'student', stripeStatus: 'paused' });
  assert.equal('tier' in student.profiles, false);
  assert.equal(student.profiles.student_past_due_since, NOW);
});

test('replaying the same plan is idempotent and does not overwrite timestamps', () => {
  const first = plan({ role: 'doctor', stripeStatus: 'past_due' });
  const second = plan({
    role: 'doctor',
    stripeStatus: 'past_due',
    paymentIssueSince: first.profiles.payment_issue_since ?? null,
    now: '2026-12-01T00:00:00.000Z',
  });
  assert.deepEqual(first, second);
  assert.equal(second.profiles.payment_issue_since, NOW);

  const again = plan({ role: 'student', stripeStatus: 'past_due', paymentIssueSince: null, studentPastDueSince: null });
  const duplicate = plan({ role: 'student', stripeStatus: 'past_due', paymentIssueSince: null, studentPastDueSince: null });
  assert.deepEqual(again, duplicate);
});

test('a stale active event uses the retrieved canceled status', () => {
  const status = resolveStripeStatus('active', 'canceled');
  assert.equal(status, 'canceled');
  const result = plan({ role: 'doctor', stripeStatus: status });
  assert.equal(result.profiles.tier, 'free');
  assert.equal(result.profiles.subscription_status, 'canceled');
  assert.equal(result.doctors?.membership_tier, 'free');
});

test('invoice.payment_failed never changes the tier', () => {
  for (const role of ['doctor', 'student'] as const) {
    const result = plan({
      role,
      stripeStatus: 'past_due',
      intent: 'payment_failed',
      paymentIssueSince: EARLIER,
      studentPastDueSince: EARLIER,
    });
    assert.equal('tier' in result.profiles, false);
    assert.equal('subscription_status' in result.profiles, false);
    assert.equal(result.doctors, null);
    assert.equal(result.profiles.payment_issue_since, EARLIER);
    if (role === 'student') assert.equal(result.profiles.student_past_due_since, EARLIER);
    else assert.equal('student_past_due_since' in result.profiles, false);
  }

  const firstFailure = plan({ role: 'doctor', stripeStatus: 'past_due', intent: 'payment_failed' });
  assert.equal(firstFailure.profiles.payment_issue_since, NOW);
  assert.equal('tier' in firstFailure.profiles, false);
});

test('undefined payment_issue_since column is recognized without using the error text as a signal to grant', () => {
  assert.equal(isUndefinedPaymentIssueColumn({ code: '42703', message: 'column "payment_issue_since" does not exist' }), true);
  assert.equal(isUndefinedPaymentIssueColumn({ code: '42703', message: '' }), true);
  assert.equal(isUndefinedPaymentIssueColumn({ code: 'PGRST204', message: "Could not find the 'payment_issue_since' column of 'profiles' in the schema cache" }), true);
  assert.equal(isUndefinedPaymentIssueColumn({ code: '42703', message: 'column "other" does not exist' }), false);
  assert.equal(isUndefinedPaymentIssueColumn(null), false);
});
