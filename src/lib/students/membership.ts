import 'server-only';
import { cache } from 'react';
import { STUDENT_CONFIG } from '@/config/students';
import { createAdminClient } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { deriveStudentMembership, type StudentMembership, type StudentPlan } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';

type ProfileRow = {
  role?: string | null;
  tier?: string | null;
  created_at?: string | null;
  stripe_customer_id?: string | null;
  student_past_due_since?: string | null;
};

async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const admin = createAdminClient();
  const full = await admin
    .from('profiles')
    .select('role, tier, created_at, stripe_customer_id, student_past_due_since')
    .eq('id', userId)
    .maybeSingle();
  if (full.error && missingSchema(full.error)) {
    const basic = await admin.from('profiles').select('role, tier, created_at, stripe_customer_id').eq('id', userId).maybeSingle();
    return (basic.data as ProfileRow | null) ?? null;
  }
  return (full.data as ProfileRow | null) ?? null;
}

function fromProfile(row: ProfileRow | null): StudentMembership {
  let plan: StudentPlan = null;
  let subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' | null = null;
  if (row?.tier === 'student_paid' && row.student_past_due_since) {
    subscriptionStatus = 'past_due';
  } else if (row?.tier === 'student_paid') {
    plan = 'monthly';
  }
  return deriveStudentMembership({
    role: row?.role,
    tier: row?.tier,
    createdAt: row?.created_at,
    launchAt: STUDENT_CONFIG.launchAt,
    graceDays: STUDENT_CONFIG.freeAccessGraceDays,
    subscriptionStatus,
    plan,
    pastDueSince: row?.student_past_due_since ?? null,
  });
}

export const getStudentMembership = cache(async (userId: string): Promise<StudentMembership> => {
  return fromProfile(await loadProfile(userId));
});

/** Stripe is checked here only. Layout and gates use getStudentMembership. */
export const getStudentBilling = cache(async (userId: string): Promise<StudentMembership> => {
  const row = await loadProfile(userId);
  const base = fromProfile(row);
  if (!row?.stripe_customer_id) return base;
  try {
    const listed = await stripe.subscriptions.list({
      customer: row.stripe_customer_id,
      status: 'all',
      limit: 10,
    });
    const sub = listed.data.find((item) => item.metadata?.role === 'student') || listed.data[0];
    if (!sub) return base;
    const price = sub.items?.data?.[0]?.price;
    const cents = price?.unit_amount ?? null;
    const interval = price?.recurring?.interval;
    const plan: StudentPlan = interval === 'year' ? 'annual' : interval === 'month' ? 'monthly' : null;
    const status = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due' || sub.status === 'canceled'
      ? sub.status
      : 'none';
    const periodEnd = (sub as { current_period_end?: number }).current_period_end;
    const renewsAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
    return deriveStudentMembership({
      role: row.role,
      tier: row.tier,
      createdAt: row.created_at,
      launchAt: STUDENT_CONFIG.launchAt,
      graceDays: STUDENT_CONFIG.freeAccessGraceDays,
      subscriptionStatus: status,
      priceCents: cents,
      plan,
      renewsAt,
      pastDueSince: row.student_past_due_since || new Date().toISOString(),
      isFounding: sub.metadata?.founding === '1',
    });
  } catch {
    return base;
  }
});
