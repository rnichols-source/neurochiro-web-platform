import { accessForStripeStatus } from '../portal/membership.ts';

export type SubscriptionIntent = 'subscription' | 'payment_failed';

export type SubscriptionPlanInput = {
  role: string;
  stripeStatus: string;
  hasOtherLiveMembership: boolean;
  paymentIssueSince: string | null;
  studentPastDueSince?: string | null;
  now: string;
  intent?: SubscriptionIntent;
};

/**
 * Columns that exist on `profiles` in production. There is no `profiles.subscription_status`
 * column, and `profiles.tier` is an enum (standard, pro, admin), so "free" is written as "standard".
 */
export type ProfileBillingUpdate = {
  tier?: ProfileTier;
  payment_issue_since?: string | null;
  student_past_due_since?: string | null;
};

export type ProfileTier = 'pro' | 'student_paid' | 'standard';

/** The unpaid value of the `profiles.tier` enum. `doctors.membership_tier` is text and uses "free". */
export const PROFILE_FREE_TIER = 'standard' as const;

export type DoctorBillingUpdate = {
  membership_tier: 'pro' | 'free';
};

export type SubscriptionPlan = {
  profiles: ProfileBillingUpdate;
  doctors: DoctorBillingUpdate | null;
};

type DbError = { code?: string; message?: string } | null | undefined;

const LIVE_MEMBERSHIP = new Set(['active', 'trialing', 'past_due']);

export function resolveStripeStatus(eventStatus: string, retrievedStatus: string | null | undefined): string {
  const retrieved = (retrievedStatus || '').trim();
  return retrieved || eventStatus;
}

export function isLiveMembershipStatus(status: string): boolean {
  return LIVE_MEMBERSHIP.has(status);
}

function isStudentRole(role: string): boolean {
  return role === 'student' || role === 'student_paid';
}

function paidTier(role: string): 'pro' | 'student_paid' {
  return isStudentRole(role) ? 'student_paid' : 'pro';
}

function stamp(existing: string | null | undefined, now: string, set: boolean): string | null {
  if (!set) return null;
  return existing ?? now;
}

/**
 * Pure column plan for a membership subscription change.
 * Timestamps use set-if-null so a second call with the same inputs returns the same row.
 * `payment_failed` sets the payment-issue flag and never writes a tier.
 */
export function planSubscriptionChange(input: SubscriptionPlanInput): SubscriptionPlan {
  const student = isStudentRole(input.role);
  const doctor = input.role === 'doctor';
  const intent = input.intent ?? 'subscription';

  if (intent === 'payment_failed') {
    const profiles: ProfileBillingUpdate = {
      payment_issue_since: stamp(input.paymentIssueSince, input.now, true),
    };
    if (student) {
      profiles.student_past_due_since = stamp(input.studentPastDueSince, input.now, true);
    }
    return { profiles, doctors: null };
  }

  const access = accessForStripeStatus(input.stripeStatus, input.role);
  const paid = access.paid === false && input.hasOtherLiveMembership ? true : access.paid;
  const profiles: ProfileBillingUpdate = {
    payment_issue_since: stamp(input.paymentIssueSince, input.now, access.paymentIssue),
  };
  if (student) {
    profiles.student_past_due_since = stamp(input.studentPastDueSince, input.now, access.paymentIssue);
  }

  if (paid === 'unchanged') {
    return { profiles, doctors: null };
  }

  profiles.tier = paid ? paidTier(input.role) : PROFILE_FREE_TIER;
  return {
    profiles,
    doctors: doctor ? { membership_tier: paid ? 'pro' : 'free' } : null,
  };
}

/** Postgres 42703, or PostgREST's schema-cache miss for the same missing column. */
export function isUndefinedPaymentIssueColumn(error: DbError): boolean {
  if (!error) return false;
  const message = error.message || '';
  const namesThisColumn = message.includes('payment_issue_since');
  if (error.code === '42703' && (namesThisColumn || message.length === 0)) return true;
  if (error.code === 'PGRST204' && namesThisColumn) return true;
  return false;
}

/**
 * When a profiles update is rejected, name the one key to drop before retrying, or null to stop.
 * - PGRST204 / 42703: a column the database does not have. Drop the column it names.
 * - 22P02 with a tier in the payload: the tier value is not in the enum (for example "student_paid").
 *   Drop the tier so the payment flags still save.
 */
export function profileKeyToDrop(error: DbError, payload: Record<string, unknown>): string | null {
  if (!error) return null;
  const message = error.message || '';
  if (error.code === 'PGRST204' || error.code === '42703') {
    const named = message.match(/'([a-z0-9_]+)' column/i)?.[1] || message.match(/column "([a-z0-9_]+)"/i)?.[1] || message.match(/'([a-z0-9_]+)'/i)?.[1];
    if (named && named in payload) return named;
    return null;
  }
  if (error.code === '22P02' && 'tier' in payload) return 'tier';
  return null;
}
