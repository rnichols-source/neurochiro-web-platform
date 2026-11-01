import {
  COUNTRY_NAMES,
  DIRECTORY_SPECIALTIES,
  type ConcernId,
  type QuizCountry,
} from './options.ts'

const KM_PER_MILE = 1.60934

export type DistanceUnit = 'mi' | 'km'

export function displayDistance(miles: number, country: QuizCountry): { value: number; unit: DistanceUnit; word: string } {
  if (country === 'US') {
    const value = Math.round(miles)
    return { value, unit: 'mi', word: value === 1 ? 'mile' : 'miles' }
  }
  const value = Math.round(miles * KM_PER_MILE)
  return { value, unit: 'km', word: value === 1 ? 'kilometer' : 'kilometers' }
}

export function resultsHeadline(input: {
  count: number
  bandMiles: number | null
  noLocal: boolean
  closestMiles: number | null
  place: string
  country: QuizCountry
  empty: boolean
}): string {
  if (input.empty || input.count === 0) {
    return `We don't have doctors in ${COUNTRY_NAMES[input.country]} yet.`
  }
  if (input.noLocal) {
    const closest = displayDistance(input.closestMiles ?? 0, input.country)
    const threshold = displayDistance(100, input.country)
    return `No NeuroChiro doctors within ${threshold.value} ${threshold.word} of ${input.place} yet. These are the closest to you, starting ${closest.value} ${closest.word} away.`
  }
  const band = displayDistance(input.bandMiles ?? 100, input.country)
  const noun = input.count === 1 ? 'nervous system chiropractor' : 'nervous system chiropractors'
  return `${input.count} ${noun} within ${band.value} ${band.word} of ${input.place}`
}

/** Card distance. Uses "away", never "near", including doctors outside the band. */
export function cardDistanceText(distance: number | null, unit: DistanceUnit): string {
  if (distance == null) return ''
  const word = unit === 'km'
    ? (distance === 1 ? 'kilometer' : 'kilometers')
    : (distance === 1 ? 'mile' : 'miles')
  if (distance <= 0) return `Less than 1 ${unit === 'km' ? 'kilometer' : 'mile'} away`
  return `${distance} ${word} away`
}

export function directoryHref(input: {
  place: string
  country: QuizCountry
  concern: ConcernId
  noLocal: boolean
  empty: boolean
}): string {
  if (input.empty) return '/directory'
  const params = new URLSearchParams()
  params.set('location', input.place)
  params.set('country', input.country)
  if (!input.noLocal) {
    const specialties = DIRECTORY_SPECIALTIES[input.concern]
    if (specialties.length) params.set('specialties', specialties.slice(0, 2).join(','))
    params.set('new_patients', '1')
  }
  return `/directory?${params.toString()}`
}

export function findingMessage(place: string): string {
  return `Finding doctors near ${place}...`
}

export function liveResultMessage(input: { count: number; noLocal: boolean; empty: boolean; headline: string }): string {
  if (input.empty) return input.headline
  if (input.noLocal) return input.headline
  return `${input.count} matches found`
}

export function sentenceChip(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (trimmed === trimmed.toUpperCase()) {
    const lower = trimmed.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function doctorLastName(name: string): string {
  const stripped = name.replace(/^Dr\.\s*/i, '').trim()
  const parts = stripped.split(/\s+/).filter(Boolean)
  return parts[parts.length - 1] || 'this doctor'
}

export function requestSuccessMessage(practice: string): string {
  const office = practice.trim() || 'the office'
  return `Request sent to ${office}. The office usually replies within 1 business day.`
}
