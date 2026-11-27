import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase-admin';
import { deriveMembership, type Membership } from '@/lib/portal/membership';

type DoctorMembershipRow = {
  membership_tier?: string | null;
  is_founding_member?: boolean | null;
  neuros_tier?: string | null;
  created_at?: string | null;
  stripe_customer_id?: string | null;
};

export const getMembership = cache(async (userId: string): Promise<Membership> => {
  const admin = createAdminClient();
  // Neither profiles nor doctors has a subscription_status column in production. Asking for it
  // made the whole profile lookup fail, so every Stripe-billed doctor looked comped. The live
  // Stripe status is read on the billing page itself.
  // The generated types are behind the doctors table, so read these columns through a narrow type.
  const doctors = admin.from('doctors') as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: DoctorMembershipRow | null }>;
      };
    };
  };
  const [{ data: profile }, { data: doctor }] = await Promise.all([
    admin.from('profiles').select('tier, stripe_customer_id').eq('id', userId).maybeSingle(),
    doctors.select('membership_tier, is_founding_member, neuros_tier, created_at, stripe_customer_id').eq('user_id', userId).maybeSingle(),
  ]);

  return deriveMembership({
    membershipTier: doctor?.membership_tier,
    profileTier: profile?.tier,
    isFoundingMember: doctor?.is_founding_member,
    neurosTier: doctor?.neuros_tier,
    createdAt: doctor?.created_at,
    hasStripeCustomer: Boolean(profile?.stripe_customer_id || doctor?.stripe_customer_id),
    stripeStatus: null,
  });
});
