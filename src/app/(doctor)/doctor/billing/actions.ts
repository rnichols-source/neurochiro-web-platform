'use server'

import { unstable_cache } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

type StripeBilling = {
  subscription: {
    id: string;
    status: string;
    price: number;
    interval: string;
    nextBilling: string;
    paymentMethod: string | null;
  } | null;
  invoices: {
    id: string;
    date: string;
    amount: number;
    status: Stripe.Invoice.Status | null;
    url: string | null;
    number: string | null;
  }[];
};

const loadStripeBilling = unstable_cache(
  async (customerId: string): Promise<StripeBilling> => {
    const [subscriptions, invoices] = await Promise.all([
      stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
        status: 'all',
        expand: ['data.default_payment_method'],
      }),
      stripe.invoices.list({
        customer: customerId,
        limit: 10,
      }),
    ]);
    const activeSubscription = subscriptions.data[0] as any;
    return {
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        status: activeSubscription.status,
        price: activeSubscription.items?.data?.[0]?.price?.unit_amount ? activeSubscription.items.data[0].price.unit_amount / 100 : 0,
        interval: activeSubscription.items?.data?.[0]?.plan?.interval || 'month',
        nextBilling: activeSubscription.current_period_end
          ? new Date(activeSubscription.current_period_end * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })
          : '---',
        paymentMethod: activeSubscription.default_payment_method?.card?.last4 || null,
      } : null,
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        date: new Date(inv.created * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
        amount: inv.amount_paid / 100,
        status: inv.status,
        url: inv.hosted_invoice_url ?? null,
        number: inv.number,
      })),
    };
  },
  ['doctor-stripe-billing-v1'],
  { revalidate: 60 },
);

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
