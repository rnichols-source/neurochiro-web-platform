import { isValidYmd } from './dates.ts'
import { LEGACY_EXTRAS, type LibraryKpi } from './library.ts'

export type LegacyEntry = {
  date: string
  patient_visits: number | null
  new_patients: number | null
  collections: number | null
  no_shows: number | null
  energy_level: number | null
}

export type LegacyPoint = { slug: string; date: string; value: number }

function finite(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

/** Old daily rows. Collections were stored in cents. */
export function mapLegacyEntry(entry: LegacyEntry): LegacyPoint[] {
  const date = typeof entry.date === 'string' ? entry.date.slice(0, 10) : ''
  if (!isValidYmd(date)) return []
  const points: LegacyPoint[] = []
  const add = (slug: string, value: number | null) => {
    if (value == null) return
    points.push({ slug, date, value })
  }
  add('patient_visits', finite(entry.patient_visits))
  add('new_patients', finite(entry.new_patients))
  add('no_shows', finite(entry.no_shows))
  const collections = finite(entry.collections)
  if (collections != null) add('collections', collections / 100)
  const energy = finite(entry.energy_level)
  if (energy != null && energy > 0) add('energy', energy)
  return points
}

export type LegacyGoal = { slug: string; goalValue: number; goalPeriod: 'daily' }

/** Replace a starting goal with a saved one, and leave a goal the doctor already changed. */
export function shouldApplyLegacyGoal(current: number | null, libraryDefault: number | null, legacy: number): boolean {
  if (!Number.isFinite(legacy)) return false
  if (current == null) return libraryDefault == null
  if (libraryDefault == null) return false
  return Math.abs(current - libraryDefault) < 0.0001
}

export function mapLegacyGoals(data: unknown): LegacyGoal[] {
  if (!data || typeof data !== 'object') return []
  const source = data as Record<string, unknown>
  const goals: LegacyGoal[] = []
  const add = (slug: string, key: string, scale = 1) => {
    const value = finite(source[key])
    if (value == null) return
    goals.push({ slug, goalValue: value / scale, goalPeriod: 'daily' })
  }
  add('patient_visits', 'visits')
  add('new_patients', 'newPatients')
  add('collections', 'collections', 100)
  add('no_shows', 'noShows')
  add('referrals', 'referrals')
  return goals
}

export function mapLegacyExtras(data: unknown): { points: LegacyPoint[]; definitions: LibraryKpi[] } {
  if (!data || typeof data !== 'object') return { points: [], definitions: [] }
  const source = data as Record<string, unknown>
  const rawDate = typeof source.date === 'string' ? source.date.slice(0, 10) : ''
  if (!isValidYmd(rawDate)) return { points: [], definitions: [] }
  const points: LegacyPoint[] = []
  const definitions: LibraryKpi[] = []
  const add = (slug: string, key: string, legacy = false) => {
    const value = finite(source[key])
    if (value == null) return
    points.push({ slug, date: rawDate, value })
    if (legacy && LEGACY_EXTRAS[slug]) definitions.push(LEGACY_EXTRAS[slug])
  }
  add('referrals', 'referrals')
  add('reactivations', 'reactivations')
  add('legacy_case_acceptance', 'caseAcceptance', true)
  add('legacy_services_per_visit', 'servicesPerVisit', true)
  return { points, definitions }
}
