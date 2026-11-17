import { APPLICATION_COUNTRIES } from './countries.ts'
import { normalizeInstagram, normalizeWebsite, parseHeardAbout } from './answers.ts'
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

export type ApplicationGap = { key: string; label: string }

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
  if (practice.length < 20 || practice.length > 2000) {
    gaps.push({ key: 'practice', label: 'How you practice' })
  }
  if (!heardReady(text(input.heardAbout))) {
    gaps.push({ key: 'heard', label: 'How you heard about NeuroChiro' })
  }
  if (text(input.whyJoin).length > 2000) {
    gaps.push({ key: 'why', label: 'Why you want to join' })
  }

  const techniques = text(input.techniques)
  if (techniques.length < 2 || techniques.length > 500) {
    gaps.push({ key: 'techniques', label: 'Techniques' })
  }
  const scans = input.usesNervousSystemScans
  const usesScans = scans === true || scans === 'yes'
  const answeredScans = scans === true || scans === false || scans === 'yes' || scans === 'no'
  if (!answeredScans) {
    gaps.push({ key: 'scans', label: 'Nervous system scans' })
  } else if (usesScans && text(input.scanTypes).length < 2) {
    gaps.push({ key: 'scans', label: 'Which scans' })
  }

  const yearsRaw = input.yearsInPractice
  const yearsBlank = yearsRaw == null || (typeof yearsRaw !== 'number' && text(yearsRaw) === '')
  const years = typeof yearsRaw === 'number' ? yearsRaw : Number(text(yearsRaw))
  if (yearsBlank || !Number.isInteger(years) || years < 0 || years > 80) {
    gaps.push({ key: 'years', label: 'Years in practice' })
  }
  if (text(input.officeAddress).length < 4) {
    gaps.push({ key: 'address', label: 'Office address' })
  }
  if (text(input.city).length < 2) {
    gaps.push({ key: 'city', label: 'City' })
  }
  const country = text(input.country).toUpperCase()
  if (!COUNTRY_CODES.has(country as typeof APPLICATION_COUNTRIES[number]['code'])) {
    gaps.push({ key: 'country', label: 'Country' })
  }
  const website = text(input.website)
  if (website && !/^https?:\/\/.+\..+/i.test(normalizeWebsite(website))) {
    gaps.push({ key: 'website', label: 'Website' })
  }
  if (normalizeInstagram(text(input.instagram)).length > 80) {
    gaps.push({ key: 'instagram', label: 'Instagram' })
  }

  const email = text(input.email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    gaps.push({ key: 'email', label: 'Email' })
  }
  const mobile = text(input.mobileE164) || text(input.mobile)
  if (!toApplicationE164(mobile, country || 'US')) {
    gaps.push({ key: 'mobile', label: 'Mobile number' })
  }
  if (input.plan !== 'monthly' && input.plan !== 'annual') {
    gaps.push({ key: 'plan', label: 'Plan' })
  }
  if (input.cardOnFile !== true) {
    gaps.push({ key: 'card', label: 'Card on file' })
  }
  return gaps
}

export function approveBlockMessage(gaps: ApplicationGap[]): string | null {
  if (gaps.length === 0) return null
  return `Can't approve yet. Missing: ${gaps.map((gap) => gap.label).join(', ')}.`
}

export function gapsBeforeCard(input: ChecklistInput): ApplicationGap[] {
  return applicationGaps({ ...input, cardOnFile: true }).filter((gap) => gap.key !== 'card')
}
