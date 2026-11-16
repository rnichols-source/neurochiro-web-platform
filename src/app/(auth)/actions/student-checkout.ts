'use server'

import { priceMatches } from '@/lib/students/price-guard'
import {
  countFoundingSubscriptions,
  foundingCheckoutOpen,
  listOpenFoundingHolds,
  priceSpec,
  resolveStudentPriceId,
} from '@/lib/students/founding-count'
import { sessionKeepsFoundingSeat } from '@/lib/students/founding-seats'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'

type Plan = 'monthly' | 'annual'

const HOLD_SECONDS = 32 * 60

function liveSubscription(status: string): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due'
}

async function assertPrice(priceId: string, expectCents: number, interval: 'month' | 'year') {
  const price = await stripe.prices.retrieve(priceId)
  if (!priceMatches(price.unit_amount, price.recurring?.interval, expectCents, interval)) {
    console.error('Student price refused')
    return false
  }
  return true
}

export async function createStudentCheckout(plan: Plan = 'monthly') {
  if (plan !== 'monthly' && plan !== 'annual') {
    return { error: 'Choose monthly or yearly.' }
  }

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.neurochiro.co'

  try {
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
      const admin = createAdminClient()
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const existing = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })
    if (existing.data.some((subscription) => liveSubscription(subscription.status))) {
      return { error: 'You already have an active subscription.' }
    }

    let founding = false
    try {
      founding = await foundingCheckoutOpen(user.id)
    } catch (error) {
      console.error('[students] founding seat check failed', error instanceof Error ? error.message : 'unknown')
      founding = false
    }

    const chosen = await openCheckout({
      userId: user.id,
      customerId,
      plan,
      founding,
      siteUrl,
    })
    if ('error' in chosen) return chosen
    return { url: chosen.url }
  } catch (error: unknown) {
    console.error('Student checkout error')
    const message = error instanceof Error ? error.message : 'Failed to create checkout'
    return { error: message }
  }
}

async function openCheckout(input: {
  userId: string
  customerId: string
  plan: Plan
  founding: boolean
  siteUrl: string
}): Promise<{ url: string } | { error: string }> {
  if (input.founding) {
    const [alreadyTaken, openHolds] = await Promise.all([countFoundingSubscriptions(), listOpenFoundingHolds()])
    const mine = openHolds.find((hold) => hold.userId === input.userId && hold.plan === input.plan)
    if (mine && sessionKeepsFoundingSeat({ subscriptionCount: alreadyTaken, holds: openHolds, sessionId: mine.id })) {
      const existing = await stripe.checkout.sessions.retrieve(mine.id)
      if (existing.status === 'open' && existing.url) return { url: existing.url }
    }
    for (const hold of openHolds) {
      if (hold.userId === input.userId) {
        await stripe.checkout.sessions.expire(hold.id).catch(() => {})
      }
    }

    const founded = await createPricedSession({ ...input, founding: true })
    if ('error' in founded) return founded
    const [taken, holds] = await Promise.all([countFoundingSubscriptions(), listOpenFoundingHolds()])
    const ranked = holds.some((hold) => hold.id === founded.id)
      ? holds
      : [...holds, { id: founded.id, created: founded.created, userId: input.userId }]
    if (sessionKeepsFoundingSeat({ subscriptionCount: taken, holds: ranked, sessionId: founded.id })) {
      return { url: founded.url }
    }
    await stripe.checkout.sessions.expire(founded.id).catch(() => {})
  }

  const regular = await createPricedSession({ ...input, founding: false })
  if ('error' in regular) return regular
  return { url: regular.url }
}

async function createPricedSession(input: {
  userId: string
  customerId: string
  plan: Plan
  founding: boolean
  siteUrl: string
}): Promise<{ id: string; url: string; created: number } | { error: string }> {
  const spec = priceSpec(input.plan, input.founding)
  const priceId = resolveStudentPriceId(spec)
  const matches = await assertPrice(priceId, spec.expectCents, spec.interval)
  if (!matches) {
    return { error: 'Membership checkout is not ready yet. Email support@neurochirodirectory.com.' }
  }

  const session = await stripe.checkout.sessions.create({
    customer: input.customerId,
    mode: 'subscription',
    client_reference_id: input.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: !input.founding,
    ...(input.founding ? { expires_at: Math.floor(Date.now() / 1000) + HOLD_SECONDS } : {}),
    success_url: `${input.siteUrl}/student/welcome?subscribed=1`,
    cancel_url: `${input.siteUrl}/student/subscribe?canceled=1`,
    metadata: {
      userId: input.userId,
      role: 'student',
      plan: input.plan,
      priceId,
      founding: input.founding ? '1' : '0',
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        role: 'student',
        plan: input.plan,
        ...(input.founding ? { founding: '1', priceLock: 'until_graduation' } : {}),
      },
    },
  })

  if (!session.url) return { error: 'Membership checkout is not ready yet. Email support@neurochirodirectory.com.' }
  return { id: session.id, url: session.url, created: session.created || Math.floor(Date.now() / 1000) }
}
