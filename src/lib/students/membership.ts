import 'server-only';
import { cache } from 'react';
import { STUDENT_CONFIG } from '@/config/students';
import { createAdminClient } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';
import { FOUNDING_INCLUDED_SUBSCRIPTION_IDS } from '@/lib/students/founding-seats';
import { deriveStudentMembership, type StudentMembership, type StudentPlan } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';

type ProfileRow = {
  role?: string | null;
  tier?: string | null;
  email?: string | null;
  created_at?: string | null;
  stripe_customer_id?: string | null;
  student_past_due_since?: string | null;
};

async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const admin = createAdminClient();
  const full = await admin
    .from('profiles')
    .select('role, tier, email, created_at, stripe_customer_id, student_past_due_since')
    .eq('id', userId)
    .maybeSingle();
  if (full.error && missingSchema(full.error)) {
    const basic = await admin.from('profiles').select('role, tier, email, created_at, stripe_customer_id').eq('id', userId).maybeSingle();
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

function membershipFromSubscription(row: ProfileRow, sub: {
  id: string;
  status: string;
  metadata?: { role?: string; founding?: string } | null;
  items?: { data?: { price?: { unit_amount?: number | null; recurring?: { interval?: string | null } | null } | null }[] };
  current_period_end?: number;
}): StudentMembership {
  const price = sub.items?.data?.[0]?.price;
  const cents = price?.unit_amount ?? null;
  const interval = price?.recurring?.interval;
  const plan: StudentPlan = interval === 'year' ? 'annual' : interval === 'month' ? 'monthly' : null;
  const status = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due' || sub.status === 'canceled'
    ? sub.status
    : 'none';
  const renewsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
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
    isFounding: sub.metadata?.founding === '1' || FOUNDING_INCLUDED_SUBSCRIPTION_IDS.has(sub.id) || cents === STUDENT_CONFIG.founding.monthly.expectCents,
  });
}

async function stripeMembership(row: ProfileRow): Promise<StudentMembership | null> {
  const movedId = [...FOUNDING_INCLUDED_SUBSCRIPTION_IDS][0];
  try {
    if (row.stripe_customer_id) {
      const listed = await stripe.subscriptions.list({
        customer: row.stripe_customer_id,
        status: 'all',
        limit: 10,
      });
      const sub = listed.data.find((item) => item.id === movedId || item.metadata?.role === 'student') || listed.data[0];
      if (sub) return membershipFromSubscription(row, sub);
    }
    if (!movedId) return null;
    const moved = await stripe.subscriptions.retrieve(movedId);
    const customerId = typeof moved.customer === 'string' ? moved.customer : moved.customer?.id;
    if (row.stripe_customer_id && customerId === row.stripe_customer_id) {
      return membershipFromSubscription(row, moved);
    }
    if (row.email && customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email && customer.email.toLowerCase() === row.email.toLowerCase()) {
        return membershipFromSubscription(row, moved);
      }
    }
  } catch (error) {
    console.error('[students] membership lookup failed', error instanceof Error ? error.message : 'unknown');
  }
  return null;
}

/** Profile tier plus the live Stripe subscription. Layout, billing, and ChiroMatch all use this. */
export const getStudentMembership = cache(async (userId: string): Promise<StudentMembership> => {
  const row = await loadProfile(userId);
  const base = fromProfile(row);
  if (!row) return base;
  const live = await stripeMembership(row);
  return live || base;
});

export const getStudentBilling = getStudentMembership;
