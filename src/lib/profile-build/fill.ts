import { getDoctorTimezone } from '../doctor-timezone.ts'
import { resolveStateCode } from '../resolve-state.ts'
import type { ExtractedProfile, VoiceDraft } from './types.ts'
import { voiceFaqs } from './voice.ts'

export type ResearchDraft = {
  clinicName: string
  photoUrl: string
  hours: string
  bookingUrl: string
  websiteUrl: string
  instagramUrl: string
  facebookUrl: string
  tiktokUrl: string
  certifications: string[]
  specialties: string[]
  firstVisitInfo: string
  firstVisitPrice: string
  acceptedPayment: string[]
  insuranceNetworks: string[]
  paymentModel: '' | 'cash' | 'insurance' | 'both'
  filesInsurance: boolean | null
  paymentPlans: boolean | null
  hasEveningHours: boolean | null
  hasWeekendHours: boolean | null
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  bio: string
  shortIntro: string
  philosophy: string
  faq: { question: string; answer: string }[]
}

const FILLABLE = [
  'clinic_name',
  'photo_url',
  'hours',
  'booking_url',
  'website_url',
  'instagram_url',
  'facebook_url',
  'tiktok_url',
  'certifications',
  'specialties',
  'first_visit_info',
  'first_visit_price',
  'accepted_payment',
  'insurance_networks',
  'payment_model',
  'files_insurance',
  'payment_plans',
  'has_evening_hours',
  'has_weekend_hours',
  'address',
  'city',
  'state',
  'zip_code',
  'country',
  'bio',
  'short_intro',
  'philosophy',
  'faq',
  'timezone',
  'profile_built_at',
] as const

export function isBlank(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function draftFromExtraction(extracted: ExtractedProfile, voice: VoiceDraft, photoUrl: string, websiteUrl: string): ResearchDraft {
  return {
    clinicName: extracted.clinicName,
    photoUrl,
    hours: extracted.hours,
    bookingUrl: extracted.bookingUrl,
    websiteUrl,
    instagramUrl: extracted.instagramUrl,
    facebookUrl: extracted.facebookUrl,
    tiktokUrl: extracted.tiktokUrl,
    certifications: extracted.certifications,
    specialties: extracted.techniques,
    firstVisitInfo: extracted.firstVisitInfo,
    firstVisitPrice: extracted.firstVisitPrice,
    acceptedPayment: extracted.acceptedPayment,
    insuranceNetworks: extracted.insuranceNetworks,
    paymentModel: extracted.paymentModel,
    filesInsurance: extracted.filesInsurance,
    paymentPlans: extracted.paymentPlans,
    hasEveningHours: extracted.hasEveningHours,
    hasWeekendHours: extracted.hasWeekendHours,
    address: extracted.address,
    city: extracted.city,
    state: extracted.state,
    zipCode: extracted.zipCode,
    country: extracted.country,
    bio: voice.bio,
    shortIntro: voice.shortIntro,
    philosophy: voice.philosophy,
    faq: voiceFaqs(extracted.faqs, voice.faqs),
  }
}

export function researchColumns(draft: ResearchDraft): Record<string, unknown> {
  const columns: Record<string, unknown> = {}
  const country = normalizeCountry(draft.country)
  const state = draft.state ? resolveStateCode(draft.state, country || 'US') : null
  assign(columns, 'clinic_name', draft.clinicName, 160)
  assign(columns, 'photo_url', draft.photoUrl, 500)
  assign(columns, 'hours', draft.hours, 1000)
  assign(columns, 'booking_url', draft.bookingUrl, 300)
  assign(columns, 'website_url', draft.websiteUrl, 300)
  assign(columns, 'instagram_url', draft.instagramUrl, 300)
  assign(columns, 'facebook_url', draft.facebookUrl, 300)
  assign(columns, 'tiktok_url', draft.tiktokUrl, 300)
  if (draft.certifications.length) columns.certifications = draft.certifications
  if (draft.specialties.length) columns.specialties = draft.specialties.slice(0, 12)
  assign(columns, 'first_visit_info', draft.firstVisitInfo, 800)
  assign(columns, 'first_visit_price', draft.firstVisitPrice, 80)
  if (draft.acceptedPayment.length) columns.accepted_payment = draft.acceptedPayment
  if (draft.insuranceNetworks.length) columns.insurance_networks = draft.insuranceNetworks
  if (draft.paymentModel) columns.payment_model = draft.paymentModel
  if (draft.filesInsurance != null) columns.files_insurance = draft.filesInsurance
  if (draft.paymentPlans === true) columns.payment_plans = true
  if (draft.hasEveningHours === true) columns.has_evening_hours = true
  if (draft.hasWeekendHours === true) columns.has_weekend_hours = true
  assign(columns, 'address', draft.address, 300)
  assign(columns, 'city', draft.city, 80)
  if (state) columns.state = state
  assign(columns, 'zip_code', draft.zipCode, 20)
  if (country) columns.country = country
  assign(columns, 'bio', draft.bio, 4000)
  assign(columns, 'short_intro', draft.shortIntro, 500)
  assign(columns, 'philosophy', draft.philosophy, 1000)
  if (draft.faq.length) columns.faq = draft.faq.slice(0, 5)
  return columns
}

export function applyResearch(
  current: Record<string, unknown>,
  draft: ResearchDraft,
  now: string,
  options: { complete?: boolean } = {},
): Record<string, unknown> {
  const proposed = researchColumns(draft)
  const state = typeof proposed.state === 'string' ? proposed.state : text(current.state)
  const country = typeof proposed.country === 'string' ? proposed.country : text(current.country)
  const zone = getDoctorTimezone(state, country || 'US')
  const currentForFill = { ...current }
  if (zone && timezoneIsOpen(current.timezone, current.profile_built_at, zone)) {
    proposed.timezone = zone
    currentForFill.timezone = ''
  }
  if (options.complete !== false && isBlank(current.profile_built_at)) proposed.profile_built_at = now
  return fillOnlyBlank(currentForFill, proposed)
}

export function fillOnlyBlank(current: Record<string, unknown>, proposed: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const key of FILLABLE) {
    if (!Object.prototype.hasOwnProperty.call(proposed, key)) continue
    if (!isBlank(current[key])) continue
    const value = proposed[key]
    if (isBlank(value)) continue
    patch[key] = value
  }
  return patch
}

function timezoneIsOpen(current: unknown, builtAt: unknown, resolved: string): boolean {
  if (isBlank(current)) return true
  if (typeof current !== 'string') return false
  const stored = current.trim()
  if (stored === 'America/New_York' && resolved !== 'America/New_York' && isBlank(builtAt)) return true
  return false
}

function assign(columns: Record<string, unknown>, key: string, value: string, max: number) {
  const next = value.trim()
  if (!next) return
  columns[key] = next.slice(0, max)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCountry(value: string): string {
  const key = value.trim().toLowerCase()
  if (!key) return ''
  if (key === 'us' || key === 'usa' || key === 'united states') return 'US'
  if (key === 'ca' || key === 'canada') return 'CA'
  if (key === 'gb' || key === 'uk' || key === 'united kingdom') return 'GB'
  if (key === 'au' || key === 'australia') return 'AU'
  if (/^[a-z]{2}$/i.test(value.trim())) return value.trim().toUpperCase().slice(0, 8)
  return ''
}
