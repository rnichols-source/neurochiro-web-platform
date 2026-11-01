import { isDemoSlug } from '../directory/exclude-demo.ts'
import {
  CONCERN_SPECIALTIES,
  type ConcernId,
  type PriorityId,
  type QuizCountry,
} from './options.ts'

export const BANDS = [10, 25, 50, 100] as const

export type RankDoctor = {
  id: string
  slug?: string | null
  first_name?: string | null
  last_name?: string | null
  clinic_name?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  verification_status?: string | null
  specialties?: string[] | null
  photo_url?: string | null
  accepting_new_patients?: boolean | null
  accepts_walkins?: boolean | null
  distance_miles?: number | null
  /** Present on search rows. Ranking never reads it. */
  profile_views?: number | null
  /** Present on search rows. Ranking never reads it. */
  membership_tier?: string | null
}

export type RankAnswers = {
  concern: ConcernId
  country: QuizCountry
  priority: PriorityId
}

export type RankedMatch = RankDoctor & {
  fit: number
  distance_miles: number
}

export type RankResult = {
  matches: RankedMatch[]
  band: number | null
  noLocal: boolean
  closestMiles: number | null
  empty: boolean
}

const SLUG_RE = /^[a-z0-9-]+$/

export function specialtyFit(specialties: string[] | null | undefined, concern: ConcernId): number {
  const terms = CONCERN_SPECIALTIES[concern]
  const blob = (specialties || []).join(' | ').toLowerCase()
  let score = 0
  for (const term of terms) {
    if (blob.includes(term.toLowerCase())) score += 1
    if (score >= 2) break
  }
  return score
}

export function orderedSpecialties(specialties: string[] | null | undefined, concern: ConcernId): string[] {
  const terms = CONCERN_SPECIALTIES[concern].map((term) => term.toLowerCase())
  const matched: string[] = []
  const rest: string[] = []
  for (const item of specialties || []) {
    const low = item.toLowerCase()
    if (terms.some((term) => low.includes(term))) matched.push(item)
    else rest.push(item)
  }
  return [...matched, ...rest].slice(0, 3)
}

function countryOk(doctorCountry: string | null | undefined, requested: QuizCountry): boolean {
  const code = (doctorCountry || '').trim().toUpperCase()
  if (requested === 'US') return code === '' || code === 'US'
  if (requested === 'UK') return code === 'UK' || code === 'GB'
  return code === requested
}

function lastName(doctor: RankDoctor): string {
  return (doctor.last_name || '').trim().toLowerCase()
}

function eligible(doctors: RankDoctor[], answers: RankAnswers): RankedMatch[] {
  const seen = new Set<string>()
  const rows: RankedMatch[] = []
  for (const doctor of doctors) {
    const slug = doctor.slug || ''
    if (!doctor.id || seen.has(doctor.id)) continue
    if (!slug || isDemoSlug(slug) || !SLUG_RE.test(slug)) continue
    if (doctor.verification_status !== 'verified') continue
    if (doctor.accepting_new_patients === false) continue
    if (typeof doctor.distance_miles !== 'number' || !Number.isFinite(doctor.distance_miles)) continue
    if (!countryOk(doctor.country, answers.country)) continue
    seen.add(doctor.id)
    rows.push({ ...doctor, slug, distance_miles: doctor.distance_miles, fit: specialtyFit(doctor.specialties, answers.concern) })
  }
  return rows
}

function compare(a: RankedMatch, b: RankedMatch, priority: PriorityId): number {
  const distance = a.distance_miles - b.distance_miles
  const fit = b.fit - a.fit
  const accepting = Number(b.accepting_new_patients === true) - Number(a.accepting_new_patients === true)
  const walk = Number(b.accepts_walkins === true) - Number(a.accepts_walkins === true)
  const name = lastName(a).localeCompare(lastName(b))
  if (priority === 'closest') {
    if (distance) return distance
    if (fit) return fit
    if (accepting) return accepting
    return name
  }
  if (priority === 'specialty') {
    if (fit) return fit
    if (distance) return distance
    if (accepting) return accepting
    return name
  }
  if (priority === 'new_patients') {
    if (accepting) return accepting
    if (fit) return fit
    if (distance) return distance
    return name
  }
  if (walk) return walk
  if (fit) return fit
  if (distance) return distance
  if (accepting) return accepting
  return name
}

export function rankMatches(doctors: RankDoctor[], answers: RankAnswers): RankResult {
  const rows = eligible(doctors, answers)
  if (rows.length === 0) {
    return { matches: [], band: null, noLocal: false, closestMiles: null, empty: true }
  }

  for (const band of BANDS) {
    const group = rows.filter((doctor) => doctor.distance_miles <= band)
    if (group.length >= 3) {
      const matches = [...group].sort((a, b) => compare(a, b, answers.priority)).slice(0, 6)
      return { matches, band, noLocal: false, closestMiles: null, empty: false }
    }
  }

  const within100 = rows.filter((doctor) => doctor.distance_miles <= 100)
  if (within100.length > 0) {
    const matches = [...within100].sort((a, b) => compare(a, b, answers.priority)).slice(0, 6)
    return { matches, band: 100, noLocal: false, closestMiles: null, empty: false }
  }

  const farthest = [...rows].sort((a, b) => a.distance_miles - b.distance_miles || lastName(a).localeCompare(lastName(b)))
  return {
    matches: farthest.slice(0, 6),
    band: null,
    noLocal: true,
    closestMiles: farthest[0].distance_miles,
    empty: false,
  }
}
