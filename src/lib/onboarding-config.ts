/**
 * Onboarding email sequence configuration.
 * All constants in one place for the member onboarding flow.
 */

import { activeUsdDoctorPlan, newUsdPaymentLink } from './pricing.ts'

const LEGACY_US_MONTHLY_URL = 'https://buy.stripe.com/eVq00l3EH0NCeOW4vO7wA0W'
const LEGACY_US_ANNUAL_URL = 'https://buy.stripe.com/cNieVf4IL67W22a5zS7wA0X'

/** US Payment Links for a new member. The $199 links apply only after the price change. Env vars can replace them. */
export function usDoctorPaymentLinks(
  env: NodeJS.ProcessEnv = process.env,
  now: number = Date.now(),
): { monthly: { url: string; label: string }; annual: { url: string; label: string } } {
  const rate = activeUsdDoctorPlan(now)
  return {
    monthly: {
      url: newUsdPaymentLink('monthly', env, now) || LEGACY_US_MONTHLY_URL,
      label: rate.perMonthSlash,
    },
    annual: {
      url: newUsdPaymentLink('annual', env, now) || LEGACY_US_ANNUAL_URL,
      label: rate.annualSaves,
    },
  }
}

const OTHER_PAYMENT_LINKS = {
  AU: {
    monthly: { url: 'https://buy.stripe.com/cNieVfdfh53SbCK8M47wA10', label: 'A$129/month' },
    annual: { url: 'https://buy.stripe.com/eVq5kFgrtgMA5em0fy7wA12', label: 'A$1,290/year' },
  },
  CA: {
    monthly: { url: 'https://buy.stripe.com/8x28wR5MP7c04ai9Q87wA11', label: 'CA$139/month' },
    annual: { url: '', label: '' },
  },
  GB: {
    monthly: { url: 'https://buy.stripe.com/14A00ldfh3ZO9uC9Q87wA0Z', label: '£79/month' },
    annual: { url: '', label: '' },
  },
} as const

export const ONBOARDING_CONFIG = {
  PROFILE_BUILD_SLA_HOURS: 24,
  FOLLOWER_COUNT: '189k',

  CALENDLY_ONBOARDING: 'https://calendly.com/drray-neurochirodirectory/neurochiro-onboarding-call',
  CALENDLY_SPOTLIGHT: 'https://calendly.com/drray-neurochirodirectory/neurochiro-spotlight-interview-1',
  CALENDLY_IG_LIVE: 'https://calendly.com/drray-neurochirodirectory/the-weekly-adjustment-ig-live-interview',

  AGREEMENT_PDF_URL: 'https://gddapefwrmucimpdhjrz.supabase.co/storage/v1/object/public/documents/NeuroChiro_Pro_Membership_Agreement.pdf',

  // Payment links by country. US is read at send time so the Dec 1 price can apply without a new deploy.
  get PAYMENT_LINKS(): Record<string, { monthly: { url: string; label: string }; annual: { url: string; label: string } }> {
    return {
      US: usDoctorPaymentLinks(),
      ...OTHER_PAYMENT_LINKS,
    }
  },

  NUDGE_AGREEMENT_DAYS: 3,
  NUDGE_CALL_DAYS: 5,
  NUDGE_ESCALATE_DAYS: 10,
} as const
