'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { invalidateDoctorStripe, loadStripeBilling } from '@/lib/billing/stripe-cache';

export async function invalidateCurrentDoctorStripe() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
  invalidateDoctorStripe(data?.stripe_customer_id);
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

    if (!profile?.stripe_customer_id) {
      return { noCustomer: true, tier: profile?.tier };
    }

    const stripeBilling = await loadStripeBilling(profile.stripe_customer_id);

    return {
      tier: profile.tier,
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
