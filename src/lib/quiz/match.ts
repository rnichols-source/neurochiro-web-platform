import {
  cardDistanceText,
  directoryHref,
  displayDistance,
  resultsHeadline,
  sentenceChip,
  type DistanceUnit,
} from './copy.ts'
import {
  GENERIC_ERROR_MESSAGE,
  INVALID_MESSAGE,
  RATE_LIMIT_MESSAGE,
  UNKNOWN_PLACE_MESSAGE,
} from './options.ts'
import { orderedSpecialties, rankMatches, type RankDoctor } from './rank.ts'
import { matchInputSchema, normalizedPostal, placeLabel, type MatchInput } from './schema.ts'

export type QuizMatch = {
  id: string
  slug: string
  name: string
  clinic: string | null
  city: string | null
  region: string | null
  distance: number | null
  unit: DistanceUnit
  specialties: string[]
  photoUrl: string | null
  accepting: boolean | null
  walkIns: boolean | null
  verified: boolean
  offer?: { title: string } | null
  awayLabel: string
}

export type SearchPayload = {
  doctors?: RankDoctor[]
  nearest?: RankDoctor[]
  unknownPlace?: boolean
  error?: boolean
}

export type MatchSuccess = {
  ok: true
  matches: QuizMatch[]
  headline: string
  liveMessage: string
  band: number | null
  noLocal: boolean
  closestMiles: number | null
  empty: boolean
  place: string
  country: MatchInput['country']
  concern: MatchInput['concern']
  priority: MatchInput['priority']
  directoryHref: string
  directoryLabel: string
  sessionId: string
  source: MatchInput['source']
}

export type MatchFailure = {
  ok: false
  code: 'rate_limited' | 'invalid' | 'unknown_place' | 'error'
  message: string
}

export type MatchActionResult = MatchSuccess | MatchFailure

function toMatch(doctor: RankDoctor & { distance_miles: number; fit: number }, input: MatchInput): QuizMatch {
  const shown = displayDistance(doctor.distance_miles, input.country)
  const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.replace(/\s+/g, ' ').trim()
  return {
    id: doctor.id,
    slug: doctor.slug || '',
    name,
    clinic: doctor.clinic_name || null,
    city: doctor.city || null,
    region: doctor.state || null,
    distance: shown.value,
    unit: shown.unit,
    specialties: orderedSpecialties(doctor.specialties, input.concern).map(sentenceChip),
    photoUrl: doctor.photo_url || null,
    accepting: doctor.accepting_new_patients === true ? true : null,
    walkIns: doctor.accepts_walkins === true ? true : doctor.accepts_walkins === false ? false : null,
    verified: true,
    offer: null,
    awayLabel: cardDistanceText(shown.value, shown.unit),
  }
}

function success(ranked: ReturnType<typeof rankMatches>, input: MatchInput, place: string): MatchSuccess {
  const matches = ranked.matches.map((doctor) => toMatch(doctor, input))
  const shown = ranked.empty ? 0 : Math.min(3, matches.length)
  const headline = resultsHeadline({
    count: shown,
    bandMiles: ranked.band,
    noLocal: ranked.noLocal,
    closestMiles: ranked.closestMiles,
    place,
    country: input.country,
    empty: ranked.empty,
  })
  return {
    ok: true,
    matches,
    headline,
    liveMessage: ranked.empty || ranked.noLocal ? headline : `${shown} matches found`,
    band: ranked.band,
    noLocal: ranked.noLocal,
    closestMiles: ranked.closestMiles,
    empty: ranked.empty,
    place,
    country: input.country,
    concern: input.concern,
    priority: input.priority,
    directoryHref: directoryHref({
      place,
      country: input.country,
      concern: input.concern,
      noLocal: ranked.noLocal,
      empty: ranked.empty,
    }),
    directoryLabel: ranked.empty ? 'Browse the directory' : `See all doctors near ${place}`,
    sessionId: input.sessionId,
    source: input.source,
  }
}

export async function runMatch(
  raw: unknown,
  deps: {
    limitAllowed: boolean
    search: (params: Record<string, string>) => Promise<SearchPayload>
    onValid?: (input: MatchInput) => void
  },
): Promise<MatchActionResult> {
  if (!deps.limitAllowed) return { ok: false, code: 'rate_limited', message: RATE_LIMIT_MESSAGE }
  const parsed = matchInputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, code: 'invalid', message: INVALID_MESSAGE }
  const input = parsed.data
  deps.onValid?.(input)

  const postal = normalizedPostal(input)
  const place = placeLabel(input)
  const base: Record<string, string> = {
    location: postal || place,
    country: input.country === 'UK' ? 'UK' : input.country,
    limit: '200',
    sort: 'distance',
  }

  let payload: SearchPayload
  try {
    payload = await deps.search(base)
  } catch (err) {
    console.error('[QUIZ] matchDoctors:', err instanceof Error ? err.message : 'search failed')
    return { ok: false, code: 'error', message: GENERIC_ERROR_MESSAGE }
  }

  if (payload.unknownPlace || payload.error) {
    return { ok: false, code: 'unknown_place', message: UNKNOWN_PLACE_MESSAGE }
  }

  let doctors = [...(payload.doctors || []), ...(payload.nearest || [])]
  let ranked = rankMatches(doctors, input)
  // A resolved ZIP can still come back empty when the directory search only looks nearby.
  const thin = (payload.doctors || []).length < 3 && (ranked.noLocal || ranked.empty)
  if (thin) {
    try {
      const wider = await deps.search({ ...base, radius: '4000' })
      const widerDoctors = wider.doctors && wider.doctors.length > 0 ? wider.doctors : (wider.nearest || [])
      if (widerDoctors.length > 0) {
        doctors = [...widerDoctors, ...doctors]
        ranked = rankMatches(doctors, input)
      }
    } catch (err) {
      console.error('[QUIZ] matchDoctors:', err instanceof Error ? err.message : 'wider search failed')
    }
  }

  return success(ranked, input, place)
}
