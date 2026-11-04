import { currencyForCountry, type DoctorCurrency } from './prices.ts'
import { APPLICATION_COUNTRIES } from './countries.ts'

export { APPLICATION_COUNTRIES }

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

export function validateAnswers(input: unknown): { ok: true; value: ApplicationAnswers } | { ok: false; error: string } {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const practiceApproach = text(source.practiceApproach)
  const techniques = text(source.techniques)
  const scanTypes = text(source.scanTypes)
  const officeAddress = text(source.officeAddress)
  const city = text(source.city)
  const state = text(source.state).toUpperCase()
  const country = text(source.country).toUpperCase()
  const website = text(source.website)
  const instagram = normalizeInstagram(text(source.instagram))
  const heardAbout = text(source.heardAbout)
  const whyJoin = text(source.whyJoin)
  const yearsRaw = source.yearsInPractice
  const yearsInPractice = typeof yearsRaw === 'number' ? yearsRaw : Number(text(yearsRaw))
  const usesNervousSystemScans = source.usesNervousSystemScans === true || source.usesNervousSystemScans === 'yes'

  if (practiceApproach.length < 20) return { ok: false, error: 'Tell us a bit more about how you practice. A few sentences is enough.' }
  if (practiceApproach.length > 2000) return { ok: false, error: 'The practice answer is too long.' }
  if (techniques.length < 2) return { ok: false, error: 'Add the techniques you use.' }
  if (techniques.length > 500) return { ok: false, error: 'The techniques answer is too long.' }
  if (source.usesNervousSystemScans !== true && source.usesNervousSystemScans !== false && source.usesNervousSystemScans !== 'yes' && source.usesNervousSystemScans !== 'no') {
    return { ok: false, error: 'Let us know whether you use nervous system scans.' }
  }
  if (usesNervousSystemScans && scanTypes.length < 2) {
    return { ok: false, error: 'Which scans do you use? INSiGHT, HRV, and thermal are examples.' }
  }
  if (!Number.isInteger(yearsInPractice) || yearsInPractice < 0 || yearsInPractice > 80) {
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
  if (heardAbout.length < 2) return { ok: false, error: 'Tell us how you heard about NeuroChiro.' }
  if (whyJoin.length < 20) return { ok: false, error: 'Tell us a little more about why you want to join.' }
  if (whyJoin.length > 2000) return { ok: false, error: 'The “why join” answer is too long.' }

  return {
    ok: true,
    value: {
      practiceApproach,
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
      heardAbout,
      whyJoin,
    },
  }
}

export function currencyForAnswers(country: string): DoctorCurrency {
  if (country === 'OTHER') return 'USD'
  return currencyForCountry(country)
}
