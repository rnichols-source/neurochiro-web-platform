import { detectPostalCode } from '../detect-postal.ts'
import { fold, includeNullCountry, matchCountry, countryStoredValues } from '../geo/country-alias.ts'
import { matchRegion, regionCodes, regionCountry, regionLabel } from '../geo/region-alias.ts'

export type LocationOption = {
  kind: 'state' | 'country'
  code: string
  label: string
}

export type LocationAmbiguity = {
  token: string
  options: LocationOption[]
}

export type PostalQuery = {
  code: string
  compact: string
  country: string
  prefix: boolean
}

export type LocationQuery = {
  text: string[]
  postal: PostalQuery | null
  city: string | null
  states: string[]
  countries: string[]
  ambiguous: LocationAmbiguity[]
}

const TOKEN_COLUMNS = ['first_name', 'last_name', 'clinic_name', 'email', 'city', 'state', 'zip_code', 'country', 'slug'] as const

export function escapeLikeWildcards(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/** LIKE-escape first, then quote backslash and double quotes for a PostgREST `.or()` value. */
function quoteOr(body: string): string {
  const like = escapeLikeWildcards(body)
  const quoted = like.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return quoted
}

export function postgrestOrIlike(value: string): string {
  return `"%${quoteOr(value)}%"`
}

export function postgrestOrPrefix(value: string): string {
  return `"${quoteOr(value)}%"`
}

export function postgrestOrExact(value: string): string {
  return `"${quoteOr(value)}"`
}

/** Trim, drop a leading dr/dr. at a token boundary, split on whitespace and commas, cap at 4. */
export function searchTokens(q: string): string[] {
  const stripped = q.trim().toLowerCase().replace(/^dr\.?(?=\s|,|$)/, '').trim()
  if (!stripped) return []
  return stripped.split(/[\s,]+/).filter(Boolean).slice(0, 4)
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

function spellings(value: string): string[] {
  const folded = fold(value)
  return unique([value, value.toLowerCase(), folded])
}

function emptyQuery(): LocationQuery {
  return { text: [], postal: null, city: null, states: [], countries: [], ambiguous: [] }
}

function hintIso(hint?: { country?: string }): string {
  if (!hint?.country) return ''
  return matchCountry(hint.country)?.iso2 || hint.country.trim().toUpperCase()
}

function postalQuery(raw: string, hint?: { country?: string }): LocationQuery | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const words = trimmed.split(/\s+/)
  const caSpaced = words.length === 2 && /^[A-Za-z]\d[A-Za-z]$/.test(words[0]) && /^\d[A-Za-z]\d$/.test(words[1])
  const gbSpaced = words.length === 2 && /^[A-Za-z]{1,2}\d[A-Za-z\d]?$/.test(words[0]) && /^\d[A-Za-z]{2}$/.test(words[1])
  if (words.length > 2) return null
  if (words.length === 2 && !caSpaced && !gbSpaced) return null

  const collapsed = trimmed.replace(/\s+/g, '').toUpperCase()
  if (/^\d{3}$/.test(collapsed)) {
    return { ...emptyQuery(), postal: { code: collapsed, compact: collapsed, country: 'US', prefix: true } }
  }
  if (/^\d{4}$/.test(collapsed)) {
    const hinted = hintIso(hint)
    if (hinted === 'AU' || hinted === 'NZ') {
      return { ...emptyQuery(), postal: { code: collapsed, compact: collapsed, country: hinted, prefix: false } }
    }
    return {
      ...emptyQuery(),
      postal: { code: collapsed, compact: collapsed, country: 'US', prefix: true },
      ambiguous: [{
        token: trimmed,
        options: [
          { kind: 'country', code: 'AU', label: 'Australia' },
          { kind: 'country', code: 'NZ', label: 'New Zealand' },
        ],
      }],
    }
  }
  const us = collapsed.match(/^(\d{5})(?:-?\d{4})?$/)
  if (us && us[1] !== '00000') {
    return { ...emptyQuery(), postal: { code: us[1], compact: us[1], country: 'US', prefix: false } }
  }

  const detected = detectPostalCode(trimmed, hintIso(hint) || 'US')
  if (!detected) return null
  return {
    ...emptyQuery(),
    postal: {
      code: detected.code,
      compact: collapsed,
      country: detected.country,
      prefix: false,
    },
  }
}

function stateOptions(token: string, code: string, countryHint?: string): LocationOption[] {
  const region = matchRegion(code, countryHint) || matchRegion(token, countryHint)
  const options: LocationOption[] = []
  if (region) options.push({ kind: 'state', code: region.code, label: region.name })
  const country = matchCountry(fold(token).length === 2 ? token : code)
  if (country && country.iso2 !== 'US') {
    options.push({ kind: 'country', code: country.iso2, label: country.name })
  }
  return options
}

function countryResult(token: string, iso2: string, label: string): LocationQuery {
  return {
    ...emptyQuery(),
    countries: [iso2],
    ambiguous: [{ token, options: [{ kind: 'country', code: iso2, label }] }],
  }
}

function stateResult(token: string, code: string, countryHint?: string): LocationQuery {
  const options = stateOptions(token, code, countryHint)
  return {
    ...emptyQuery(),
    states: [code],
    ambiguous: options.length ? [{ token, options }] : [],
  }
}

function preferCountry(raw: string, region: ReturnType<typeof matchRegion>, country: ReturnType<typeof matchCountry>): boolean {
  if (!country) return false
  if (!region) return true
  if (/^[a-z]{2}$/.test(fold(raw))) return false
  return true
}

/**
 * Parse an admin search into postal, city, state, country, and leftover name tokens.
 * Does not geocode and does not touch the network.
 */
export function parseLocationQuery(q: string, hint?: { country?: string }): LocationQuery {
  const raw = q.trim()
  if (!raw) return emptyQuery()

  const postal = postalQuery(raw, hint)
  if (postal) return postal

  const country = matchCountry(raw)
  const region = matchRegion(raw, hintIso(hint) || undefined)
  if (country && preferCountry(raw, region, country)) return countryResult(raw, country.iso2, country.name)
  if (region && (fold(region.name) === fold(raw) || fold(region.code) === fold(raw) || (region.aliases || []).some((alias) => fold(alias) === fold(raw)))) {
    return stateResult(raw, region.code, hintIso(hint) || region.country)
  }

  if (raw.includes(',')) {
    const parts = raw.split(',')
    const right = parts[parts.length - 1]?.trim() || ''
    const left = parts.slice(0, -1).join(',').trim()
    const rightRegion = left ? matchRegion(right, hintIso(hint) || undefined) : null
    if (rightRegion && left) {
      return { ...emptyQuery(), city: left, states: [rightRegion.code] }
    }
  }

  const words = raw.split(/\s+/).filter(Boolean)
  const hinted = hintIso(hint) || undefined
  for (let size = Math.min(3, words.length - 1); size >= 1; size -= 1) {
    const suffix = words.slice(-size).join(' ')
    const suffixRegion = matchRegion(suffix, hinted)
    if (!suffixRegion) continue
    const city = words.slice(0, -size).join(' ')
    if (!city) continue
    return { ...emptyQuery(), city, states: [suffixRegion.code] }
  }

  return { ...emptyQuery(), text: searchTokens(raw) }
}

export function locationActive(parsed: LocationQuery): boolean {
  return Boolean(parsed.postal || parsed.city || parsed.states.length || parsed.countries.length)
}

/** Enter on a full postal code or "City, ST" opens the nearby list. A ZIP prefix stays a text filter. */
export function isNearbyPlace(parsed: LocationQuery): boolean {
  if (parsed.postal && !parsed.postal.prefix) return true
  return Boolean(parsed.city && parsed.states.length)
}

export function describeEmpty(parsed: LocationQuery): string | null {
  if (parsed.postal?.prefix) return `No doctors with ZIP starting ${parsed.postal.code}`
  if (parsed.postal) return `No doctors with postal code ${parsed.postal.code}`
  if (parsed.city && parsed.states[0]) return `No doctors in ${parsed.city}, ${parsed.states[0]}`
  if (parsed.states[0]) return `No doctors in ${regionLabel(parsed.states[0])}`
  if (parsed.countries[0]) {
    const country = matchCountry(parsed.countries[0])
    return `No doctors in ${country?.name || parsed.countries[0]}`
  }
  if (parsed.city) return `No doctors in ${parsed.city}`
  return null
}

function tokenColumns(includeZip: boolean): readonly string[] {
  return includeZip ? TOKEN_COLUMNS : TOKEN_COLUMNS.filter((column) => column !== 'zip_code')
}

export function doctorTextFilters(tokens: string[], includeZip = true): string[] {
  const columns = tokenColumns(includeZip)
  return tokens.map((token) => spellings(token)
    .flatMap((form) => columns.map((column) => `${column}.ilike.${postgrestOrIlike(form)}`))
    .join(','))
}

export function profileTextFilters(tokens: string[]): string[] {
  return tokens.map((token) => spellings(token)
    .flatMap((form) => ['full_name', 'email'].map((column) => `${column}.ilike.${postgrestOrIlike(form)}`))
    .join(','))
}

export function postalOrFilter(postal: PostalQuery, includeZip = true): string {
  const keys = unique([postal.code, postal.compact])
  const parts: string[] = []
  for (const key of keys) {
    if (includeZip) parts.push(`zip_code.ilike.${postgrestOrPrefix(key)}`)
    parts.push(postal.prefix ? `address.ilike.${postgrestOrIlike(` ${key}`)}` : `address.ilike.${postgrestOrIlike(key)}`)
  }
  return parts.join(',')
}

export function cityOrFilter(city: string, mode: 'exact' | 'contains'): string {
  return spellings(city)
    .map((form) => `city.ilike.${mode === 'contains' ? postgrestOrIlike(form) : postgrestOrExact(form)}`)
    .join(',')
}

export type DoctorLocationPlan = {
  parsed: LocationQuery
  textFilters: string[]
  profileFilters: string[]
  postalOr: string | null
  city: string | null
  stateValues: string[]
  countryValues: string[]
  includeNullCountry: boolean
  locationActive: boolean
}

export function doctorLocationPlan(q: string, hint?: { country?: string }, includeZip = true): DoctorLocationPlan {
  const parsed = parseLocationQuery(q, hint)
  const countryIso = parsed.countries[0] || ''
  return {
    parsed,
    textFilters: doctorTextFilters(parsed.text, includeZip),
    profileFilters: profileTextFilters(parsed.text),
    postalOr: parsed.postal ? postalOrFilter(parsed.postal, includeZip) : null,
    city: parsed.city,
    stateValues: parsed.states.length ? regionCodes(parsed.states[0], regionCountry(parsed.states[0]) || undefined) : [],
    countryValues: countryIso ? countryStoredValues(countryIso) : [],
    includeNullCountry: countryIso ? includeNullCountry(countryIso) : false,
    locationActive: locationActive(parsed),
  }
}

export function quoteInList(values: string[]): string {
  return values.map((value) => (/[^A-Za-z0-9_]/.test(value) ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : value)).join(',')
}

export function countryOrFilter(values: string[], nullCountry: boolean): string {
  const listed = values.length ? `country.in.(${quoteInList(values)})` : ''
  if (nullCountry && listed) return `country.is.null,${listed}`
  if (nullCountry) return 'country.is.null'
  return listed
}

export function zipFromText(value: string | null | undefined): string | null {
  if (!value) return null
  const us = value.match(/\b(\d{5})(?:-\d{4})?\b/)
  if (us) return us[1]
  const ca = value.toUpperCase().match(/\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/)
  if (ca) return `${ca[1]}${ca[2]}`
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) return compact
  return null
}

export function requestTextMatches(parts: {
  name?: string | null
  email?: string | null
  doctorName?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  address?: string | null
  location?: string | null
}, q: string): boolean {
  const needle = q.trim()
  if (!needle) return true
  const parsed = parseLocationQuery(needle)
  const place = parsed.postal || parsed.city || parsed.states.length || parsed.countries.length
  if (!place) {
    const blob = fold([parts.name, parts.email, parts.doctorName, parts.city, parts.state, parts.zip, parts.location].filter(Boolean).join(' '))
    return parsed.text.every((token) => blob.includes(fold(token)))
  }
  const city = fold(parts.city || '')
  const state = fold(parts.state || '')
  const location = fold(parts.location || '')
  const zip = (parts.zip || '').replace(/\s+/g, '').toUpperCase()
  const addressRaw = (parts.address || '').toUpperCase()
  const address = addressRaw.replace(/\s+/g, '')
  if (parsed.postal) {
    const keys = unique([parsed.postal.code.toUpperCase(), parsed.postal.compact.toUpperCase()])
    const hit = keys.some((key) => (
      parsed.postal?.prefix
        ? zip.startsWith(key) || address.startsWith(key) || addressRaw.includes(` ${key}`) || location.includes(fold(key))
        : zip.startsWith(key) || address.includes(key) || location.includes(fold(key))
    ))
    if (!hit) return false
  }
  if (parsed.city) {
    const cityFold = fold(parsed.city)
    if (!city.includes(cityFold) && !location.includes(cityFold)) return false
  }
  if (parsed.states.length) {
    const forms = regionCodes(parsed.states[0]).map((form) => fold(form))
    const hit = forms.some((form) => state === form || location.includes(form))
    if (!hit) return false
  }
  if (parsed.countries.length) {
    const names = countryStoredValues(parsed.countries[0]).map((form) => fold(form))
    const hit = names.some((form) => location.includes(form) || state === form || city === form)
    if (!hit && !parts.location) return false
  }
  if (parsed.text.length) {
    const blob = fold([parts.name, parts.email, parts.doctorName, parts.city, parts.location].filter(Boolean).join(' '))
    if (!parsed.text.every((token) => blob.includes(fold(token)))) return false
  }
  return true
}

export { regionCodes, regionLabel, countryStoredValues, includeNullCountry }
