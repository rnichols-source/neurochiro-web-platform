'use server'

import { STUDENT_CONFIG } from '@/config/students'
import { priceMatches } from '@/lib/students/price-guard'
import { stripe } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase-server'

type Plan = 'monthly' | 'annual'

function planSpec(plan: Plan) {
  return plan === 'annual' ? STUDENT_CONFIG.membership.annual : STUDENT_CONFIG.membership.monthly
}

export async function createStudentCheckout(plan: Plan = 'monthly') {
  if (plan !== 'monthly' && plan !== 'annual') {
    return { error: 'Choose monthly or yearly.' }
  }

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const spec = planSpec(plan)
  const priceId = process.env[spec.stripePriceEnv]
  if (!priceId) {
    return { error: 'Membership checkout is not ready yet. Email support@neurochirodirectory.com.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.neurochiro.co'

  try {
    const price = await stripe.prices.retrieve(priceId)
    const interval = price.recurring?.interval
    if (!priceMatches(price.unit_amount, interval, spec.expectCents, spec.interval)) {
      console.error('Student price refused', priceId)
      return { error: 'Membership checkout is not ready yet. Email support@neurochirodirectory.com.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let customerId = (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (profile as { email?: string | null } | null)?.email || user.email,
        name: (profile as { full_name?: string | null } | null)?.full_name || undefined,
        metadata: { userId: user.id, role: 'student' },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const activeSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    if (activeSubs.data.length > 0) {
      return { error: 'You already have an active subscription.' }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/student/welcome?subscribed=1`,
      cancel_url: `${siteUrl}/student/subscribe?canceled=1`,
      metadata: { userId: user.id, role: 'student', plan },
      subscription_data: {
        metadata: { userId: user.id, role: 'student', plan },
      },
    })

    return { url: session.url }
  } catch (error: unknown) {
    console.error('Student checkout error')
    const message = error instanceof Error ? error.message : 'Failed to create checkout'
    return { error: message }
  }
}
