'use server'

import { stripe } from '@/lib/stripe'

export async function createConferenceCheckout(data: {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'student';
  billing: 'monthly' | 'annual';
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co';

  const prices = {
    doctor: { monthly: 6900, annual: 70800 },
    student: { monthly: 1200, annual: 12000 },
  };

  const priceLabels = {
    doctor: { monthly: 'Doctor Pro ($49/mo)', annual: 'Doctor Pro Annual ($490/yr)' },
    student: { monthly: 'Student Premium ($12/mo)', annual: 'Student Premium Annual ($120/yr)' },
  };

  const amount = prices[data.role][data.billing];
  const label = priceLabels[data.role][data.billing];
  const isRecurring = true;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: data.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `NeuroChiro ${label}` },
          unit_amount: amount,
          recurring: { interval: data.billing === 'monthly' ? 'month' : 'year' },
        },
        quantity: 1,
      }],
      success_url: `${siteUrl}/conference/success?email=${encodeURIComponent(data.email)}`,
      cancel_url: `${siteUrl}/conference?canceled=true`,
      metadata: {
        type: 'conference_signup',
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        billing: data.billing,
        source: 'new_beginnings_2026',
      },
    });

    return { url: session.url };
  } catch (err: any) {
    console.error('Conference checkout error:', err);
    return { error: err.message || 'Failed to create checkout' };
  }
}
