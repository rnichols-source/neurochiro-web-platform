'use server'
import { stripe, PLANS } from '@/lib/stripe'

export async function createSeminarListingCheckout(seminarData: {
  title: string; description: string; location: string; dates: string; registrationLink: string; price: string; capacity: string; hostEmail: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co';
  const priceId = PLANS.seminar_listing.oneTime.priceId;
  if (!priceId) return { error: "Seminar listing pricing not configured." };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: seminarData.hostEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/seminars?listed=true`,
    cancel_url: `${siteUrl}/host-a-seminar?canceled=true`,
    metadata: {
      type: 'seminar_listing',
      title: seminarData.title,
      description: seminarData.description.slice(0, 500),
      location: seminarData.location,
      dates: seminarData.dates,
      registrationLink: seminarData.registrationLink,
      price: seminarData.price,
      capacity: seminarData.capacity,
      hostEmail: seminarData.hostEmail,
    },
  });

  return { url: session.url };
}
