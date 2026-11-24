import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase-admin';
import { deriveMembership, type Membership, type MembershipStatus } from '@/lib/portal/membership';
import { readSelectedDoctor } from '@/lib/portal/selected-doctor';

const STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused',
  'none',
]);

export const getMembership = cache(async (userId: string): Promise<Membership> => {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('tier, stripe_customer_id, subscription_status')
    .eq('id', userId)
    .maybeSingle();

  let doctorResult = await readSelectedDoctor<{
    membership_tier?: string | null
    is_founding_member?: boolean | null
    neuros_tier?: string | null
    created_at?: string | null
    subscription_status?: string | null
  }>(userId, 'membership_tier, is_founding_member, neuros_tier, created_at, subscription_status');
  if (doctorResult.error) {
    doctorResult = await readSelectedDoctor(userId, 'membership_tier, is_founding_member, neuros_tier, created_at');
  }
  const doctor = doctorResult.data as {
    membership_tier?: string | null;
    is_founding_member?: boolean | null;
    neuros_tier?: string | null;
    created_at?: string | null;
    subscription_status?: string | null;
  } | null;

  const doctorStatus = typeof doctor?.subscription_status === 'string' ? doctor.subscription_status.trim() : '';
  const profileStatus = typeof profile?.subscription_status === 'string' ? profile.subscription_status.trim() : '';
  const rawStatus = doctorStatus || profileStatus || null;
  const stripeStatus = rawStatus && STATUSES.has(rawStatus) ? rawStatus as MembershipStatus : null;

  return deriveMembership({
    membershipTier: doctor?.membership_tier,
    profileTier: profile?.tier,
    isFoundingMember: doctor?.is_founding_member,
    neurosTier: doctor?.neuros_tier,
    createdAt: doctor?.created_at,
    hasStripeCustomer: Boolean(profile?.stripe_customer_id),
    stripeStatus: profile?.stripe_customer_id ? (stripeStatus || 'active') : stripeStatus,
  });
});
