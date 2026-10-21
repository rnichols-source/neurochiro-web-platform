'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function lookupStripeSession(sessionId: string): Promise<{ name: string; email: string } | null> {
  if (!sessionId) return null
  try {
    const { stripe } = await import('@/lib/stripe')
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return {
      name: session.customer_details?.name || '',
      email: session.customer_details?.email || session.customer_email || '',
    }
  } catch {
    return null
  }
}

export async function submitUKProfile(data: {
  name: string
  email: string
  clinic_name: string
  city: string
  postcode: string
  instagram: string
  website: string
  phone: string
  stripe_session_id: string
  country_code?: string
  source?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const nameParts = data.name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  const slug = 'dr-' + data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
  const instagram = data.instagram.replace(/^@/, '').trim().toLowerCase()

  const { error } = await (supabase as any).from('doctors').insert({
    first_name: firstName,
    last_name: lastName,
    slug,
    email: data.email.trim().toLowerCase(),
    clinic_name: data.clinic_name.trim(),
    city: data.city.trim(),
    state: data.postcode.trim().toUpperCase(),
    country: data.country_code || 'GB',
    address: '',
    bio: '',
    phone: data.phone.trim() || null,
    website_url: data.website.trim() || null,
    instagram_url: instagram ? `https://www.instagram.com/${instagram}/` : null,
    instagram_handle_normalized: instagram || null,
    specialties: [],
    verification_status: 'pending',
    membership_tier: 'pro',
    region_code: 'GB',
    is_approved: false,
    onboarding_call_status: 'not_scheduled',
    source: data.source || 'uca_birmingham_2026',
    stripe_session_id: data.stripe_session_id || null,
    latitude: 0,
    longitude: 0,
  })

  if (error) {
    console.error('[UK-WELCOME] Insert error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
