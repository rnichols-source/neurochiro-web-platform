import { fold } from './country-alias.ts'

export type Region = {
  code: string
  name: string
  country: string
  aliases?: readonly string[]
}

const US_STATES: readonly RegionRow[] = [
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['DC', 'District of Columbia'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['HI', 'Hawaii'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
]

type RegionRow = readonly [string, string] | readonly [string, string, readonly string[]]

const CA_PROVINCES: readonly RegionRow[] = [
  ['AB', 'Alberta'],
  ['BC', 'British Columbia'],
  ['MB', 'Manitoba'],
  ['NB', 'New Brunswick'],
  ['NL', 'Newfoundland and Labrador', ['Newfoundland']],
  ['NS', 'Nova Scotia'],
  ['NT', 'Northwest Territories'],
  ['NU', 'Nunavut'],
  ['ON', 'Ontario'],
  ['PE', 'Prince Edward Island', ['PEI']],
  ['QC', 'Quebec', ['Québec']],
  ['SK', 'Saskatchewan'],
]

const AU_STATES: readonly RegionRow[] = [
  ['NSW', 'New South Wales'],
  ['VIC', 'Victoria'],
  ['QLD', 'Queensland'],
  ['WA', 'Western Australia'],
  ['SA', 'South Australia'],
  ['TAS', 'Tasmania'],
  ['ACT', 'Australian Capital Territory'],
  ['NT', 'Northern Territory'],
]

const UK_NATIONS: readonly RegionRow[] = [
  ['ENG', 'England'],
  ['SCT', 'Scotland'],
  ['WLS', 'Wales'],
  ['NIR', 'Northern Ireland'],
]

function rows(country: string, pairs: readonly RegionRow[]): Region[] {
  return pairs.map((pair) => ({
    code: pair[0],
    name: pair[1],
    country,
    aliases: pair.length === 3 ? pair[2] : undefined,
  }))
}

export const REGIONS: readonly Region[] = [
  ...rows('US', US_STATES),
  ...rows('CA', CA_PROVINCES),
  ...rows('AU', AU_STATES),
  ...rows('GB', UK_NATIONS),
]

const INDEX = new Map<string, Region[]>()

function addKey(key: string, region: Region) {
  const folded = fold(key)
  if (!folded) return
  const list = INDEX.get(folded)
  if (list) {
    if (!list.includes(region)) list.push(region)
    return
  }
  INDEX.set(folded, [region])
}

for (const region of REGIONS) {
  addKey(region.code, region)
  addKey(region.name, region)
  for (const alias of region.aliases || []) addKey(alias, region)
}

function narrow(hits: Region[], country?: string): Region[] {
  if (!hits.length) return []
  if (country) {
    const wanted = country.trim().toUpperCase()
    const matched = hits.filter((hit) => hit.country === wanted)
    if (matched.length) return matched
  }
  const us = hits.filter((hit) => hit.country === 'US')
  if (!country && us.length) return us
  return hits
}

/** One region for a code or name. Shared codes prefer the country hint, then the US. */
export function matchRegion(value: string | null | undefined, country?: string): Region | null {
  if (value == null) return null
  const hits = narrow(INDEX.get(fold(value)) || [], country)
  return hits[0] || null
}

export function regionCountry(value: string | null | undefined, country?: string): string | null {
  return matchRegion(value, country)?.country || null
}

function formsOf(region: Region): string[] {
  const names = [region.name, ...(region.aliases || [])]
  const forms = [region.code, region.code.toLowerCase()]
  for (const name of names) {
    forms.push(name, name.toLowerCase(), name.toUpperCase())
  }
  return forms
}

/**
 * Every stored spelling for a region. PostgREST `in` is case-sensitive.
 * Unknown text keeps the typed, lower, and upper forms.
 */
export function regionCodes(value: string | null | undefined, country?: string): string[] {
  if (value == null) return []
  const trimmed = value.trim()
  if (!trimmed) return []
  const hits = narrow(INDEX.get(fold(trimmed)) || [], country)
  if (!hits.length) return unique([trimmed, trimmed.toLowerCase(), trimmed.toUpperCase()])
  return unique(hits.flatMap(formsOf))
}

export function regionLabel(value: string | null | undefined, country?: string): string {
  return matchRegion(value, country)?.name || (value || '').trim()
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}
