'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';

export async function getBillingData() {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('stripe_customer_id, tier')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return { noCustomer: true, tier: profile?.tier };
    }

    // Fetch subscription details
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method']
    });

    const activeSubscription = subscriptions.data[0];

    // Fetch last 10 invoices
    const invoices = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 10,
    });

    return {
      tier: profile.tier,
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        status: activeSubscription.status,
        price: activeSubscription.items.data[0].price.unit_amount ? activeSubscription.items.data[0].price.unit_amount / 100 : 0,
        interval: activeSubscription.items.data[0].plan.interval,
        nextBilling: new Date(activeSubscription.current_period_end * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }),
        paymentMethod: (activeSubscription.default_payment_method as any)?.card?.last4 || null
      } : null,
      invoices: invoices.data.map(inv => ({
        id: inv.id,
        date: new Date(inv.created * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }),
        amount: inv.amount_paid / 100,
        status: inv.status,
        url: inv.hosted_invoice_url,
        number: inv.number
      }))
    };
  } catch (error) {
    console.error("Billing Action Error:", error);
    return { error: "Failed to load billing data." };
  }
}
