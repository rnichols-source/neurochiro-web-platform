import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase-admin';
import { deriveMembership, type Membership, type MembershipStatus } from '@/lib/portal/membership';

const STATUSES = new Set(['active', 'trialing', 'past_due', 'canceled', 'none']);

export const getMembership = cache(async (userId: string): Promise<Membership> => {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('tier, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  let doctorResult = await (admin.from('doctors') as any)
    .select('membership_tier, is_founding_member, neuros_tier, created_at, subscription_status')
    .eq('user_id', userId)
    .maybeSingle();
  if (doctorResult.error) {
    doctorResult = await (admin.from('doctors') as any)
      .select('membership_tier, is_founding_member, neuros_tier, created_at')
      .eq('user_id', userId)
      .maybeSingle();
  }
  const doctor = doctorResult.data as {
    membership_tier?: string | null;
    is_founding_member?: boolean | null;
    neuros_tier?: string | null;
    created_at?: string | null;
    subscription_status?: string | null;
  } | null;

  const rawStatus = doctor?.subscription_status || null;
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
