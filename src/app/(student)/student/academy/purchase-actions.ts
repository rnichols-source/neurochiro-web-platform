'use server'

import { stripe, PLANS } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase-server'

const COURSE_PLAN_MAP: Record<string, keyof typeof PLANS> = {
  'course-clinical-identity': 'course_clinical_identity',
  'course-business': 'course_business',
  'course-clinical-confidence': 'course_clinical_confidence',
  'course-associate-playbook': 'course_associate_playbook',
}

const BUNDLE_COURSE_IDS = [
  'course-clinical-identity',
  'course-business',
  'course-clinical-confidence',
  'course-associate-playbook',
]

export async function createCourseCheckout(courseId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to purchase a course.' }

  const planKey = COURSE_PLAN_MAP[courseId]
  if (!planKey) return { error: 'Invalid course.' }

  const plan = PLANS[planKey] as any
  if (!plan?.oneTime) return { error: 'Course not available for purchase.' }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: plan.oneTime.priceId ? [
      { price: plan.oneTime.priceId, quantity: 1 }
    ] : [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
          unit_amount: plan.oneTime.price * 100,
        },
        quantity: 1,
      }
    ],
    metadata: {
      userId: user.id,
      type: 'course_purchase',
      courseId,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/academy?purchased=${courseId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/academy?canceled=true`,
  })

  return { url: session.url }
}

export async function createBundleCheckout() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to purchase.' }

  const plan = PLANS.course_bundle as any
  if (!plan?.oneTime) return { error: 'Bundle not available.' }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: plan.oneTime.priceId ? [
      { price: plan.oneTime.priceId, quantity: 1 }
    ] : [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
          unit_amount: plan.oneTime.price * 100,
        },
        quantity: 1,
      }
    ],
    metadata: {
      userId: user.id,
      type: 'course_bundle',
      courseIds: BUNDLE_COURSE_IDS.join(','),
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/academy?purchased=bundle`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/student/academy?canceled=true`,
  })

  return { url: session.url }
}

export async function getPurchasedCourses(): Promise<string[]> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    const { data } = await (supabase as any)
      .from('course_purchases')
      .select('course_id')
      .eq('user_id', user.id)

    return (data || []).map((r: any) => r.course_id)
  } catch {
    return []
  }
}
