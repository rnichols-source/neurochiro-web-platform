import { APPLICATION_COUNTRIES } from './countries.ts'
import { normalizeInstagram, normalizeWebsite, parseHeardAbout, parseYearsInPractice } from './answers.ts'
import { toApplicationE164 } from './phone.ts'

const COUNTRY_CODES = new Set(APPLICATION_COUNTRIES.map((item) => item.code))

export type ChecklistInput = {
  practiceApproach?: unknown
  heardAbout?: unknown
  whyJoin?: unknown
  techniques?: unknown
  usesNervousSystemScans?: unknown
  scanTypes?: unknown
  yearsInPractice?: unknown
  officeAddress?: unknown
  city?: unknown
  country?: unknown
  website?: unknown
  instagram?: unknown
  plan?: unknown
  cardOnFile?: boolean
  email?: unknown
  mobile?: unknown
  mobileE164?: unknown
}

export type ApplicationGap = {
  key: string
  label: string
  /** True when the field has a value that is not valid. */
  specific: boolean
  reason: string
}

function gap(key: string, label: string, specific: boolean, reason: string): ApplicationGap {
  return { key, label, specific, reason }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function heardReady(value: string): boolean {
  const parsed = parseHeardAbout(value)
  if (!parsed.choice) return false
  if (parsed.choice === 'Other') {
    const detail = parsed.other.trim()
    return detail.length >= 2 && detail.length <= 200
  }
  return true
}

/** Every field required before an admin can approve and charge. */
export function applicationGaps(input: ChecklistInput): ApplicationGap[] {
  const gaps: ApplicationGap[] = []
  const practice = text(input.practiceApproach)
  if (!practice) gaps.push(gap('practice', 'How you practice', false, 'Missing: How you practice.'))
  else if (practice.length < 20) gaps.push(gap('practice', 'How you practice', true, 'Tell us a bit more about how you practice. A few sentences is enough.'))
  else if (practice.length > 2000) gaps.push(gap('practice', 'How you practice', true, 'The practice answer is too long.'))

  const heard = text(input.heardAbout)
  if (!heardReady(heard)) {
    const parsed = parseHeardAbout(heard)
    const specific = parsed.choice === 'Other' && parsed.other.trim().length > 0
    gaps.push(gap(
      'heard',
      'How you heard about NeuroChiro',
      specific,
      specific ? 'Tell us a little more about how you heard about NeuroChiro.' : 'Missing: How you heard about NeuroChiro.',
    ))
  }
  if (text(input.whyJoin).length > 2000) {
    gaps.push(gap('why', 'Why you want to join', true, 'The “why join” answer is too long.'))
  }

  const techniques = text(input.techniques)
  if (!techniques) gaps.push(gap('techniques', 'Techniques', false, 'Missing: Techniques.'))
  else if (techniques.length < 2) gaps.push(gap('techniques', 'Techniques', true, 'Add the techniques you use.'))
  else if (techniques.length > 500) gaps.push(gap('techniques', 'Techniques', true, 'The techniques answer is too long.'))

  const scans = input.usesNervousSystemScans
  const usesScans = scans === true || scans === 'yes'
  const answeredScans = scans === true || scans === false || scans === 'yes' || scans === 'no'
  if (!answeredScans) {
    gaps.push(gap('scans', 'Nervous system scans', false, 'Missing: Nervous system scans.'))
  } else if (usesScans && text(input.scanTypes).length < 2) {
    const typed = text(input.scanTypes)
    gaps.push(gap('scans', 'Which scans', Boolean(typed), typed ? 'Which scans do you use? A short name is enough.' : 'Missing: Which scans.'))
  }

  const yearsRaw = input.yearsInPractice
  const yearsBlank = yearsRaw == null || (typeof yearsRaw === 'string' && yearsRaw.trim() === '')
  const years = parseYearsInPractice(yearsRaw)
  if (yearsBlank) gaps.push(gap('years', 'Years in practice', false, 'Missing: Years in practice.'))
  else if (years == null || years < 0 || years > 80) {
    gaps.push(gap('years', 'Years in practice', true, 'Years in practice should be a whole number from 0 to 80.'))
  }

  const address = text(input.officeAddress)
  if (address.length < 4) {
    gaps.push(gap('address', 'Office address', address.length > 0, address ? 'Add the office address.' : 'Missing: Office address.'))
  }
  const city = text(input.city)
  if (city.length < 2) gaps.push(gap('city', 'City', city.length > 0, city ? 'Add the office city.' : 'Missing: City.'))
  const country = text(input.country).toUpperCase()
  if (!COUNTRY_CODES.has(country as typeof APPLICATION_COUNTRIES[number]['code'])) {
    gaps.push(gap('country', 'Country', Boolean(country), country ? 'Choose a country.' : 'Missing: Country.'))
  }
  const website = text(input.website)
  if (website && !/^https?:\/\/.+\..+/i.test(normalizeWebsite(website))) {
    gaps.push(gap('website', 'Website', true, 'The website should look like a normal link.'))
  }
  if (normalizeInstagram(text(input.instagram)).length > 80) {
    gaps.push(gap('instagram', 'Instagram', true, 'The Instagram name is too long.'))
  }

  const email = text(input.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    gaps.push(gap('email', 'Email', Boolean(email), email ? 'Enter a normal email address.' : 'Missing: Email.'))
  }
  const mobile = text(input.mobileE164) || text(input.mobile)
  if (!toApplicationE164(mobile, country || 'US')) {
    gaps.push(gap(
      'mobile',
      'Mobile number',
      Boolean(mobile),
      mobile
        ? (country === 'OTHER' ? 'Enter a mobile number with + and the country code.' : 'Enter a mobile number for the country you selected.')
        : 'Missing: Mobile number.',
    ))
  }
  if (input.plan !== 'monthly' && input.plan !== 'annual') {
    gaps.push(gap('plan', 'Plan', false, 'Missing: Plan.'))
  }
  if (input.cardOnFile !== true) {
    gaps.push(gap('card', 'Card on file', false, 'Missing: Card on file.'))
  }
  return gaps
}

/** Blank fields stay "Missing". A filled but invalid field uses its own reason. */
export function clientGapMessage(gaps: ApplicationGap[]): string {
  const specific = gaps.filter((item) => item.specific)
  const missing = gaps.filter((item) => !item.specific)
  const parts: string[] = []
  if (missing.length > 0) parts.push(`Missing: ${missing.map((item) => item.label).join(', ')}.`)
  for (const item of specific) parts.push(item.reason.endsWith('.') ? item.reason : `${item.reason}.`)
  return parts.join(' ')
}

export function approveBlockMessage(gaps: ApplicationGap[]): string | null {
  if (gaps.length === 0) return null
  return `Can't approve yet. ${clientGapMessage(gaps)}`
}

export function gapsBeforeCard(input: ChecklistInput): ApplicationGap[] {
  return applicationGaps({ ...input, cardOnFile: true }).filter((gap) => gap.key !== 'card')
}
