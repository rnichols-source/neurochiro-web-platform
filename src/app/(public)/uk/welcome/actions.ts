'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { normalizeCoords } from '@/lib/geo'
import { isPaidCheckoutSession } from '@/lib/applications/welcome-session'

export async function lookupStripeSession(sessionId: string): Promise<{ name: string; email: string } | null> {
  if (!sessionId) return null
  try {
    const { stripe } = await import('@/lib/stripe')
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!isPaidCheckoutSession(session)) return null
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
  if (!data.stripe_session_id) {
    return { success: false, error: 'This form opens after a paid Stripe checkout.' }
  }
  const supabase = createAdminClient()
  try {
    const { stripe } = await import('@/lib/stripe')
    const session = await stripe.checkout.sessions.retrieve(data.stripe_session_id)
    if (!isPaidCheckoutSession(session)) {
      return { success: false, error: 'Stripe has not confirmed this payment yet.' }
    }
    const { data: existing } = await (supabase as any)
      .from('doctors')
      .select('id')
      .eq('stripe_session_id', data.stripe_session_id)
      .maybeSingle()
    if (existing?.id) {
      return { success: false, error: 'This payment was already used to create a listing.' }
    }
  } catch {
    return { success: false, error: 'We could not verify that Stripe payment.' }
  }

  const nameParts = data.name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  const slug = 'dr-' + data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
  const instagram = data.instagram.replace(/^@/, '').trim().toLowerCase()

  const importedCoords = normalizeCoords(null, null)
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
    region_code: data.country_code || 'GB',
    is_approved: false,
    onboarding_call_status: 'not_scheduled',
    source: data.source || 'uca_birmingham_2026',
    stripe_session_id: data.stripe_session_id || null,
    latitude: importedCoords.latitude,
    longitude: importedCoords.longitude,
  })

  if (error) {
    console.error('[UK-WELCOME] Insert error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
