'use server'

import { stripe } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase-server'

export async function createStudentCheckout(billing: 'monthly' | 'annual' = 'monthly') {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'

  try {
    // Check if user already has a stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let customerId = (profile as any)?.stripe_customer_id

    // Create Stripe customer if none exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (profile as any)?.email || user.email,
        name: (profile as any)?.full_name || undefined,
        metadata: { userId: user.id, role: 'student' },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const priceAmount = billing === 'monthly' ? 1200 : 12000 // $12/mo or $120/yr ($10/mo)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'NeuroChiro Student Membership',
              description: billing === 'monthly'
                ? 'Full access to all student tools — $12/month'
                : 'Full access to all student tools — $10/month (billed annually)',
            },
            unit_amount: billing === 'monthly' ? 1200 : 1000,
            recurring: {
              interval: billing === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/student/dashboard?subscribed=true`,
      cancel_url: `${siteUrl}/student/subscribe?canceled=true`,
      metadata: {
        userId: user.id,
        role: 'student',
        billing,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          role: 'student',
        },
      },
    })

    return { url: session.url }
  } catch (error: any) {
    console.error('Student checkout error:', error)
    return { error: error.message || 'Failed to create checkout' }
  }
}
