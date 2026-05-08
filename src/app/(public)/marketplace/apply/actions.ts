'use server'
import { stripe } from '@/lib/stripe'

export async function createVendorCheckout(formData: {
  companyName: string;
  email: string;
  website: string;
  category: string;
  description: string;
  tier: 'starter' | 'growth' | 'partner';
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co';
  const tierPrices = { starter: 9900, growth: 24900, partner: 49900 };
  const tierNames = { starter: 'Marketplace Starter', growth: 'Marketplace Growth', partner: 'Marketplace Partner' };
  const price = tierPrices[formData.tier] || 9900;
  const name = tierNames[formData.tier] || 'Marketplace Starter';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: formData.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name },
        unit_amount: price,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: `${siteUrl}/marketplace?welcome=true`,
    cancel_url: `${siteUrl}/marketplace/apply?canceled=true`,
    metadata: {
      type: 'vendor',
      tier: formData.tier,
      companyName: formData.companyName,
      email: formData.email,
      website: formData.website,
      category: formData.category,
      description: formData.description.slice(0, 500),
    },
  });

  return { url: session.url };
}
