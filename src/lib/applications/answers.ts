import { currencyForCountry, type DoctorCurrency } from './prices.ts'
import { APPLICATION_COUNTRIES } from './countries.ts'
import { toApplicationE164 } from './phone.ts'

export { APPLICATION_COUNTRIES }

export const HEARD_ABOUT_CHOICES = [
  'Instagram',
  'Referral from a doctor',
  'Podcast/YouTube',
  'Event',
  'Google',
] as const

export type ApplicationAnswers = {
  practiceApproach: string
  techniques: string
  usesNervousSystemScans: boolean
  scanTypes: string
  yearsInPractice: number
  officeAddress: string
  city: string
  state: string
  country: string
  website: string
  instagram: string
  heardAbout: string
  whyJoin: string
  mobileE164: string
  smsConsent: boolean
}

export type Step1Answers = {
  practiceApproach: string
  heardAbout: string
  whyJoin: string
}

export type Step2Answers = {
  techniques: string
  usesNervousSystemScans: boolean
  scanTypes: string
  yearsInPractice: number
  officeAddress: string
  city: string
  state: string
  country: string
  website: string
  instagram: string
  mobileE164: string
  smsConsent: boolean
}

const COUNTRY_CODES = new Set(APPLICATION_COUNTRIES.map((item) => item.code))

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeWebsite(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function normalizeInstagram(value: string): string {
  return value.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '')
}

export function parseHeardAbout(stored: string): { choice: string; other: string } {
  const value = stored.trim()
  const known = HEARD_ABOUT_CHOICES.find((item) => item.toLowerCase() === value.toLowerCase())
  if (known) return { choice: known, other: '' }
  const otherPrefix = /^other:\s*/i
  if (otherPrefix.test(value)) return { choice: 'Other', other: value.replace(otherPrefix, '').trim() }
  if (value) return { choice: 'Other', other: value }
  return { choice: '', other: '' }
}

export function composeHeardAbout(choice: string, other: string): string {
  if (choice === 'Other') {
    const detail = other.trim().replace(/\s+/g, ' ')
    return detail ? `Other: ${detail}` : ''
  }
  const known = HEARD_ABOUT_CHOICES.find((item) => item.toLowerCase() === choice.trim().toLowerCase())
  return known || ''
}

function normalizeHeard(value: string): { ok: true; heardAbout: string } | { ok: false; error: string } {
  const parsed = parseHeardAbout(value)
  if (!parsed.choice) return { ok: false, error: 'Choose how you heard about NeuroChiro.' }
  if (parsed.choice === 'Other') {
    const detail = parsed.other.trim()
    if (detail.length < 2) return { ok: false, error: 'Tell us a little more about how you heard about NeuroChiro.' }
    if (detail.length > 200) return { ok: false, error: 'That answer is too long.' }
    return { ok: true, heardAbout: `Other: ${detail}` }
  }
  return { ok: true, heardAbout: parsed.choice }
}

export function validateStep1(input: unknown): { ok: true; value: Step1Answers } | { ok: false; error: string } {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const practiceApproach = text(source.practiceApproach)
  const whyJoin = text(source.whyJoin)
  const heard = normalizeHeard(text(source.heardAbout))
  if (practiceApproach.length < 20) return { ok: false, error: 'Tell us a bit more about how you practice. A few sentences is enough.' }
  if (practiceApproach.length > 2000) return { ok: false, error: 'The practice answer is too long.' }
  if (!heard.ok) return heard
  if (whyJoin.length > 2000) return { ok: false, error: 'The “why join” answer is too long.' }
  return { ok: true, value: { practiceApproach, heardAbout: heard.heardAbout, whyJoin } }
}

export function validateStep2(input: unknown): { ok: true; value: Step2Answers } | { ok: false; error: string } {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const techniques = text(source.techniques)
  const scanTypes = text(source.scanTypes)
  const officeAddress = text(source.officeAddress)
  const city = text(source.city)
  const state = text(source.state).toUpperCase()
  const country = text(source.country).toUpperCase()
  const website = text(source.website)
  const instagram = normalizeInstagram(text(source.instagram))
  const yearsRaw = source.yearsInPractice
  const yearsBlank = yearsRaw == null || (typeof yearsRaw !== 'number' && text(yearsRaw) === '')
  const yearsInPractice = typeof yearsRaw === 'number' ? yearsRaw : Number(text(yearsRaw))
  const usesNervousSystemScans = source.usesNervousSystemScans === true || source.usesNervousSystemScans === 'yes'

  if (techniques.length < 2) return { ok: false, error: 'Add the techniques you use.' }
  if (techniques.length > 500) return { ok: false, error: 'The techniques answer is too long.' }
  if (source.usesNervousSystemScans !== true && source.usesNervousSystemScans !== false && source.usesNervousSystemScans !== 'yes' && source.usesNervousSystemScans !== 'no') {
    return { ok: false, error: 'Let us know whether you use nervous system scans.' }
  }
  if (usesNervousSystemScans && scanTypes.length < 2) {
    return { ok: false, error: 'Which scans do you use? INSiGHT, HRV, and thermal are examples.' }
  }
  if (yearsBlank || !Number.isInteger(yearsInPractice) || yearsInPractice < 0 || yearsInPractice > 80) {
    return { ok: false, error: 'Years in practice should be a whole number from 0 to 80.' }
  }
  if (officeAddress.length < 4) return { ok: false, error: 'Add the office address.' }
  if (city.length < 2) return { ok: false, error: 'Add the office city.' }
  if (!COUNTRY_CODES.has(country as typeof APPLICATION_COUNTRIES[number]['code'])) {
    return { ok: false, error: 'Choose a country.' }
  }
  if (website && !/^https?:\/\/.+\..+/i.test(normalizeWebsite(website))) {
    return { ok: false, error: 'The website should look like a normal link.' }
  }
  if (instagram.length > 80) return { ok: false, error: 'The Instagram name is too long.' }
  const mobileE164 = toApplicationE164(text(source.mobile), country)
  if (!mobileE164) {
    return {
      ok: false,
      error: country === 'OTHER'
        ? 'Enter a mobile number with + and the country code.'
        : 'Enter a mobile number for the country you selected.',
    }
  }

  return {
    ok: true,
    value: {
      techniques,
      usesNervousSystemScans,
      scanTypes: usesNervousSystemScans ? scanTypes : '',
      yearsInPractice,
      officeAddress,
      city,
      state,
      country,
      website: website ? normalizeWebsite(website) : '',
      instagram,
      mobileE164,
      smsConsent: source.smsConsent === true,
    },
  }
}

export function validateAnswers(input: unknown): { ok: true; value: ApplicationAnswers } | { ok: false; error: string } {
  const step1 = validateStep1(input)
  if (!step1.ok) return step1
  const step2 = validateStep2(input)
  if (!step2.ok) return step2
  return { ok: true, value: { ...step1.value, ...step2.value } }
}

/** First step that is still missing answers. 3 means the card step. */
export function firstUnfinishedStep(input: unknown): 1 | 2 | 3 {
  if (!validateStep1(input).ok) return 1
  if (!validateStep2(input).ok) return 2
  return 3
}

export function applicationStopLabel(input: { status: string; cardOnFile: boolean; answers: unknown }): string {
  if (input.cardOnFile || input.status !== 'draft') return 'Submitted'
  return `Step ${firstUnfinishedStep(input.answers)} of 3`
}

export function currencyForAnswers(country: string): DoctorCurrency {
  if (country === 'OTHER') return 'USD'
  return currencyForCountry(country)
}
