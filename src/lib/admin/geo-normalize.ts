import { matchCountry } from '../geo/country-alias.ts'
import { matchRegion } from '../geo/region-alias.ts'

/** Empty stays empty. Known names and aliases become ISO2. Unknown text stays trimmed upper-case. */
export function normalizeCountry(value: string | null | undefined): string {
  if (value == null) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return matchCountry(trimmed)?.iso2 || trimmed.toUpperCase()
}

/** Known US, CA, AU, and UK regions become their code. Unknown text stays trimmed upper-case. */
export function normalizeState(value: string | null | undefined, country?: string): string {
  if (value == null) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return matchRegion(trimmed, country)?.code || trimmed.toUpperCase()
}
