'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { currencyForAnswers, validateAnswers } from '@/lib/applications/answers'
import { createSetupCheckout, readPriceAmount } from '@/lib/applications/billing'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { currencyForCountry, planLabel, priceIdFor, type BillingCycle, type DoctorCurrency } from '@/lib/applications/prices'
import { ensureDraftApplication, loadApplicationByDoctor, saveAnswers, savePlan } from '@/lib/applications/store'

export type PlanChoice = {
  cycle: BillingCycle
  label: string
  available: boolean
  priceId: string
}

async function requireDoctor() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue your application.' as const }
  const admin = createAdminClient()
  const { data: doctor } = await admin
    .from('doctors')
    .select('id, first_name, last_name, email, country, city')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!doctor) return { error: 'Your doctor profile is not ready yet.' as const }
  return { user, doctor, email: user.email || doctor.email || '' }
}

export async function plansForCountry(country: string): Promise<{ currency: DoctorCurrency; plans: PlanChoice[] }> {
  const currency = currencyForAnswers(country || 'US')
  const cycles: BillingCycle[] = ['monthly', 'annual']
  const plans = await Promise.all(cycles.map(async (cycle) => {
    const priceId = priceIdFor(currency, cycle)
    const price = priceId ? await readPriceAmount(priceId) : null
    const currencyMatches = !price || price.currency === currency.toLowerCase()
    return {
      cycle,
      priceId,
      available: Boolean(priceId) && currencyMatches,
      label: planLabel(currency, cycle, currencyMatches ? price?.unitAmount : null),
    }
  }))
  return { currency, plans }
}

export async function submitApplication(input: {
  answers: unknown
  plan: BillingCycle
  referralCode?: string
}): Promise<{ error?: string; url?: string }> {
  if (!isApplicationFlowEnabled()) return { error: 'Applications are not open yet.' }
  const session = await requireDoctor()
  if ('error' in session) return { error: session.error }
  const parsed = validateAnswers(input.answers)
  if (!parsed.ok) return { error: parsed.error }
  if (input.plan !== 'monthly' && input.plan !== 'annual') return { error: 'Choose monthly or annual.' }

  const ready = await ensureDraftApplication({
    doctorId: session.doctor.id,
    userId: session.user.id,
    email: session.email,
    referralCode: input.referralCode,
  })
  if (!ready) return { error: 'We could not save the application. The database step may still need to be run.' }

  const saved = await saveAnswers(session.doctor.id, session.user.id, parsed.value, (input.referralCode || '').slice(0, 32))
  if (!saved) return { error: 'We could not save your answers. Please try again.' }

  const existing = await loadApplicationByDoctor(session.doctor.id)
  if (!existing?.id) return { error: 'The application record is missing.' }

  const currency = currencyForAnswers(parsed.value.country)
  const priceId = priceIdFor(currency, input.plan)
  if (!priceId) return { error: `The ${currency} ${input.plan} price is not configured yet.` }
  const price = await readPriceAmount(priceId)
  if (price && price.currency !== currency.toLowerCase()) {
    return { error: 'That price does not match the country you selected.' }
  }
  const label = planLabel(currency, input.plan, price?.unitAmount)

  try {
    const checkout = await createSetupCheckout({
      customerId: existing.stripeCustomerId,
      email: session.email,
      name: `${session.doctor.first_name || ''} ${session.doctor.last_name || ''}`.trim(),
      currency,
      priceId,
      applicationId: existing.id,
      doctorId: session.doctor.id,
      userId: session.user.id,
      plan: input.plan,
    })
    await savePlan(session.doctor.id, {
      plan: input.plan,
      currency,
      priceId,
      priceLabel: label,
      customerId: checkout.customerId,
    })
    if (session.user.id) {
      const admin = createAdminClient()
      await admin.from('profiles').update({ stripe_customer_id: checkout.customerId }).eq('id', session.user.id)
    }
    return { url: checkout.url }
  } catch (error) {
    console.error('[application] setup checkout failed', error instanceof Error ? error.name : 'error')
    const message = error instanceof Error ? error.message : ''
    const safe = message.startsWith('That Stripe price') || message.startsWith('Stripe did not')
      ? message
      : 'Stripe could not open the card form. Check the price settings and try again.'
    return { error: safe }
  }
}

export async function loadApplyState() {
  if (!isApplicationFlowEnabled()) return { enabled: false as const }
  const session = await requireDoctor()
  if ('error' in session) return { enabled: true as const, error: session.error }
  const application = await loadApplicationByDoctor(session.doctor.id)
  const country = application?.answers.country || currencyCountry(session.doctor.country)
  const plans = await plansForCountry(country)
  return {
    enabled: true as const,
    doctorName: session.doctor.first_name || '',
    country,
    application,
    plans,
  }
}

function currencyCountry(country: string | null): string {
  const code = (country || 'US').toUpperCase()
  if (code === 'UK') return 'GB'
  return currencyForCountry(code) === 'USD' && code !== 'US' && code !== 'OTHER' ? 'OTHER' : code
}
