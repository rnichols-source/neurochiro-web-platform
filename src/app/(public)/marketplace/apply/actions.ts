'use server'
import { stripe, PLANS } from '@/lib/stripe'

export async function createVendorCheckout(formData: {
  companyName: string; email: string; website: string; category: string; description: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co';
  const priceId = PLANS.vendor.monthly.priceId;
  if (!priceId) return { error: "Vendor pricing not configured." };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: formData.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/marketplace?welcome=true`,
    cancel_url: `${siteUrl}/marketplace/apply?canceled=true`,
    metadata: {
      type: 'vendor',
      companyName: formData.companyName,
      email: formData.email,
      website: formData.website,
      category: formData.category,
      description: formData.description.slice(0, 500),
    },
  });

  return { url: session.url };
}
