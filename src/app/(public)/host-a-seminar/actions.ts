'use server'
import { stripe, PLANS } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase-server'

export async function createMemberSeminar(seminarData: {
  title: string; description: string; location: string; dates: string; registrationLink: string; price: string; capacity: string; hostEmail: string;
}) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Please log in to create a seminar." }

    const { error } = await supabase.from('seminars').insert({
      title: seminarData.title,
      description: seminarData.description,
      location: seminarData.location,
      city: seminarData.location,
      dates: seminarData.dates,
      registration_link: seminarData.registrationLink,
      price: parseFloat(seminarData.price.replace(/[^0-9.]/g, '')) || 0,
      max_capacity: parseInt(seminarData.capacity) || null,
      host_id: user.id,
      payment_status: 'paid',
      is_approved: true,
      listing_tier: 'member',
      host_type_at_submission: 'member',
    })

    if (error) {
      console.error("Seminar creation error:", error)
      return { error: "Failed to create seminar. Please try again." }
    }

    return { success: true }
  } catch (err) {
    console.error("Seminar creation exception:", err)
    return { error: "Something went wrong. Please try again." }
  }
}

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
