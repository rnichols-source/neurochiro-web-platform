'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { invalidateDoctorStripe, loadStripeBilling } from '@/lib/billing/stripe-cache';

type ServerSupabase = ReturnType<typeof createServerSupabase>;

/** Some paying doctors have their Stripe customer only on the listing, not on the login profile. */
async function listingCustomerId(supabase: ServerSupabase, userId: string): Promise<string | null> {
  const doctors = supabase.from('doctors') as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { stripe_customer_id?: string | null } | null }>;
      };
    };
  };
  const { data } = await doctors.select('stripe_customer_id').eq('user_id', userId).maybeSingle();
  return data?.stripe_customer_id || null;
}

export async function invalidateCurrentDoctorStripe() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
  invalidateDoctorStripe(data?.stripe_customer_id || await listingCustomerId(supabase, user.id));
}

export async function getBillingData() {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, tier')
      .eq('id', user.id)
      .single();

    const customerId = profile?.stripe_customer_id || await listingCustomerId(supabase, user.id);
    if (!customerId) {
      return { noCustomer: true, tier: profile?.tier };
    }

    const stripeBilling = await loadStripeBilling(customerId);

    return {
      tier: profile?.tier,
      subscription: stripeBilling.subscription,
      invoices: stripeBilling.invoices,
    };
  } catch (error) {
    console.error("[billing] failed to load");
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(new Error("billing load failed"));
    } catch {
      // Sentry is optional in local runs.
    }
    return { error: "Failed to load billing data." };
  }
}
