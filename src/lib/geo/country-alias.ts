import { ALL_COUNTRIES, getCountryByIso2, type CountryConfig } from '../../config/countries.ts'

/** Lowercase, strip accents and periods, and collapse whitespace. */
export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[.]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const EXTRA_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ['usa', 'US'],
  ['us', 'US'],
  ['u.s.', 'US'],
  ['u.s.a.', 'US'],
  ['united states', 'US'],
  ['united states of america', 'US'],
  ['america', 'US'],
  ['uk', 'GB'],
  ['gb', 'GB'],
  ['u.k.', 'GB'],
  ['united kingdom', 'GB'],
  ['great britain', 'GB'],
  ['england', 'GB'],
  ['scotland', 'GB'],
  ['wales', 'GB'],
  ['northern ireland', 'GB'],
  ['ca', 'CA'],
  ['canada', 'CA'],
  ['au', 'AU'],
  ['aus', 'AU'],
  ['australia', 'AU'],
  ['nz', 'NZ'],
  ['new zealand', 'NZ'],
  ['ae', 'AE'],
  ['uae', 'AE'],
  ['u.a.e.', 'AE'],
  ['united arab emirates', 'AE'],
]

const BY_ALIAS = new Map<string, string>()

for (const country of ALL_COUNTRIES) {
  BY_ALIAS.set(fold(country.iso2), country.iso2)
  BY_ALIAS.set(fold(country.name), country.iso2)
}

for (const [alias, iso] of EXTRA_ALIASES) {
  BY_ALIAS.set(fold(alias), iso)
}

export type CountryMatch = {
  iso2: string
  name: string
  flag: string
}

export function matchCountry(value: string | null | undefined): CountryMatch | null {
  if (value == null) return null
  const iso = BY_ALIAS.get(fold(value))
  if (!iso) return null
  const known = getCountryByIso2(iso)
  return {
    iso2: iso,
    name: known?.name || iso,
    flag: known?.flag || '',
  }
}

export function countryByIso(iso2: string): CountryConfig | undefined {
  return getCountryByIso2(iso2)
}

/** Every stored spelling the doctors table may use for this ISO country. */
export function countryStoredValues(iso2: string): string[] {
  const iso = (matchCountry(iso2)?.iso2 || iso2.trim().toUpperCase())
  const known = getCountryByIso2(iso)
  const values = new Set<string>()
  if (iso) {
    values.add(iso)
    values.add(iso.toLowerCase())
  }
  if (known) {
    values.add(known.name)
    values.add(known.name.toLowerCase())
    values.add(known.name.toUpperCase())
  }
  if (iso === 'US') {
    for (const value of ['US', 'USA', 'us', 'usa', 'United States', 'united states', 'UNITED STATES', 'United States of America', 'united states of america']) {
      values.add(value)
    }
  }
  if (iso === 'GB') {
    for (const value of ['GB', 'UK', 'gb', 'uk', 'United Kingdom', 'united kingdom', 'UNITED KINGDOM', 'Great Britain', 'great britain']) {
      values.add(value)
    }
  }
  if (iso === 'CA') {
    for (const value of ['CA', 'ca', 'Canada', 'canada', 'CANADA']) values.add(value)
  }
  if (iso === 'AU') {
    for (const value of ['AU', 'AUS', 'au', 'aus', 'Australia', 'australia', 'AUSTRALIA']) values.add(value)
  }
  if (iso === 'NZ') {
    for (const value of ['NZ', 'nz', 'New Zealand', 'new zealand', 'NEW ZEALAND']) values.add(value)
  }
  return [...values]
}

/** Legacy US rows often have a null country. Other countries do not. */
export function includeNullCountry(iso2: string): boolean {
  return (matchCountry(iso2)?.iso2 || iso2.trim().toUpperCase()) === 'US'
}
