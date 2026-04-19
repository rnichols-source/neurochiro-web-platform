'use server'

import { stripe } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase-server'

// Generic one-time purchase checkout for any doctor product
export async function createDoctorProductCheckout(productId: string, productName: string, priceInCents: number) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: priceInCents,
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        type: 'course_purchase', // reuses existing webhook handler
        courseId: productId,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/doctor/dashboard?purchased=${productId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/doctor/dashboard`,
    })
    return { url: session.url }
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' }
  }
}

// Generic subscription checkout for doctor add-ons
export async function createDoctorSubscriptionCheckout(productName: string, priceInCents: number, returnPath: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: priceInCents,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        type: 'doctor_subscription',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}${returnPath}?subscribed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}${returnPath}`,
    })
    return { url: session.url }
  } catch (err: any) {
    return { error: err.message || 'Something went wrong' }
  }
}

// Check if user has purchased a specific product
export async function hasPurchased(productId: string): Promise<boolean> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  try {
    const { data } = await (supabase as any)
      .from('course_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', productId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}
