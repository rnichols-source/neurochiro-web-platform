/**
 * Detect postal code format and country from a raw input string.
 *
 * A selected country is checked first. US ZIP, Canadian postal codes,
 * and UK postcodes keep their lookup codes (5 digits, FSA, outward).
 * India PIN codes are 6 digits. Countries without a postal system,
 * such as the UAE, accept a short city or area and may leave it blank.
 *
 * All postal codes are strings, never numbers. Leading zeros are preserved.
 *
 * Used by: /list signup, /api/subscribe, resolve-city.ts, directory search.
 */

import { ALL_COUNTRIES, getCountryByIso2, type CountryConfig } from '../config/countries.ts'

export interface PostalDetection {
  /** The normalized code to look up in zip_codes (e.g. FSA for CA, outward for GB) */
  code: string
  /** ISO 3166-1 alpha-2 */
  country: string
}

/** Countries where a postal code is not part of a normal address. */
const POSTAL_OPTIONAL = new Set(['AE'])

/** Shown first on the patient waitlist. The rest of ALL_COUNTRIES follows. */
export const WAITLIST_PRIORITY = ['US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'IN', 'AE'] as const

const PLACEHOLDERS: Record<string, string> = {
  US: '12345',
  CA: 'V5K 1A1',
  GB: 'SW1A 1AA',
  AU: '3000',
  NZ: '1010',
  IN: '110001',
  IE: 'D02 AF30',
  AE: 'Dubai',
  DE: '10115',
  FR: '75001',
  MX: '06600',
  SG: '018956',
  JP: '100-0001',
  ZA: '8001',
  NL: '1012 AB',
  BR: '01310-100',
}

export function normalizeCountryHint(regionHint: string | null | undefined): string {
  const hint = (regionHint || 'US').trim().toUpperCase()
  if (hint === 'UK') return 'GB'
  return hint
}

export function isPostalOptional(country: string): boolean {
  return POSTAL_OPTIONAL.has(normalizeCountryHint(country))
}

export interface PostalField {
  label: string
  placeholder: string
  required: boolean
  maxLength: number
  inputMode: 'numeric' | 'text'
  hint: string
}

export function postalFieldFor(country: string): PostalField {
  const code = normalizeCountryHint(country)
  const config = getCountryByIso2(code)
  const optional = isPostalOptional(code)
  const baseLabel = config?.postalLabel || 'Postal code'
  const numeric = Boolean(config?.postalPattern && !/[A-Za-z]/.test(config.postalPattern))
  return {
    label: optional ? 'City or area (optional)' : baseLabel,
    placeholder: PLACEHOLDERS[code] || (optional ? 'City or area' : 'Postal code'),
    required: !optional,
    maxLength: maxLengthFor(code, config, numeric),
    inputMode: numeric ? 'numeric' : 'text',
    hint: optional
      ? 'A postal code is not used here. A city helps us tell you when a doctor joins nearby.'
      : '',
  }
}

function maxLengthFor(code: string, config: CountryConfig | undefined, numeric: boolean): number {
  if (code === 'US') return 10
  if (code === 'CA') return 7
  if (code === 'GB') return 8
  if (code === 'JP') return 8
  if (code === 'IN' || code === 'SG') return 6
  if (code === 'AU' || code === 'NZ') return 4
  if (numeric) return 10
  return config?.postalPattern ? 12 : 16
}

export function waitlistCountryGroups(): { priority: CountryConfig[]; rest: CountryConfig[] } {
  const priority = WAITLIST_PRIORITY
    .map((code) => getCountryByIso2(code))
    .filter((country): country is CountryConfig => Boolean(country))
  const pinned = new Set<string>(WAITLIST_PRIORITY)
  const rest = ALL_COUNTRIES
    .filter((country) => !pinned.has(country.iso2))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
  return { priority, rest }
}

/**
 * Detect postal code format from raw input.
 *
 * @param input - The raw postal code string from the user
 * @param regionHint - ISO country code. UK is accepted as an alias for GB.
 * @returns Detection result or null if not recognized for that country
 */
export function detectPostalCode(input: string, regionHint: string = 'US'): PostalDetection | null {
  const raw = input.trim()
  if (!raw) return null
  const collapsed = raw.replace(/\s+/g, '').toUpperCase()
  const hint = normalizeCountryHint(regionHint)

  if (hint === 'IN' || hint === 'SG') {
    if (/^\d{6}$/.test(collapsed) && collapsed !== '000000') return { code: collapsed, country: hint }
    return null
  }
  if (hint === 'AU' || hint === 'NZ') {
    if (/^\d{4}$/.test(collapsed)) return { code: collapsed, country: hint }
    return null
  }
  if (hint === 'CA') return detectCanada(raw)
  if (hint === 'GB') return detectUk(raw)

  const config = getCountryByIso2(hint)
  if (config?.postalPattern && hint !== 'US') {
    if (patternMatch(config.postalPattern, raw, collapsed)) {
      return { code: storedCode(collapsed), country: hint }
    }
    return null
  }
  if (config && !config.postalPattern && hint !== 'US') {
    if (!isFlexiblePostal(raw)) return null
    return { code: raw.trim().slice(0, 16), country: hint }
  }

  return detectLegacy(raw, collapsed, hint)
}

/** US default, plus Canadian and UK codes typed without changing the country. */
function detectLegacy(raw: string, collapsed: string, regionHint: string): PostalDetection | null {
  const usMatch = collapsed.match(/^(\d{5})(?:-?\d{4})?$/)
  if (usMatch) {
    const zip = usMatch[1]
    if (zip === '00000') return null
    return { code: zip, country: 'US' }
  }

  const canada = detectCanada(raw)
  if (canada) return canada

  const uk = detectUk(raw)
  if (uk) return uk

  if (/^\d{4}$/.test(collapsed) && regionHint === 'NZ') return { code: collapsed, country: 'NZ' }
  if (/^\d{4}$/.test(collapsed) && regionHint === 'AU') return { code: collapsed, country: 'AU' }
  if (/^\d{4}$/.test(collapsed) && regionHint !== 'US' && regionHint !== 'CA' && regionHint !== 'GB') {
    return { code: collapsed, country: regionHint === 'NZ' ? 'NZ' : 'AU' }
  }

  return null
}

function detectCanada(raw: string): PostalDetection | null {
  const collapsed = raw.replace(/\s+/g, '').toUpperCase()
  const full = collapsed.match(/^([A-Z]\d[A-Z])\d[A-Z]\d$/)
  if (full) return { code: full[1], country: 'CA' }
  const fsa = collapsed.match(/^([A-Z]\d[A-Z])$/)
  if (fsa) return { code: fsa[1], country: 'CA' }
  return null
}

function detectUk(raw: string): PostalDetection | null {
  const withSpace = raw.trim().toUpperCase()
  const collapsed = withSpace.replace(/\s+/g, '')
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(collapsed) || /^[A-Z]\d[A-Z]$/.test(collapsed)) return null
  const full = withSpace.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s?\d[A-Z]{2}$/)
  if (full) return { code: full[1], country: 'GB' }
  const outward = withSpace.match(/^([A-Z]{1,2}\d[A-Z\d]?)$/)
  if (outward) return { code: outward[1], country: 'GB' }
  return null
}

function patternMatch(pattern: string, raw: string, collapsed: string): boolean {
  const re = new RegExp(pattern, 'i')
  return re.test(raw.trim()) || re.test(collapsed) || re.test(raw.trim().toUpperCase())
}

function storedCode(collapsed: string): string {
  if (/^\d[\d-]+$/.test(collapsed)) return collapsed.replace(/-/g, '')
  return collapsed
}

function isFlexiblePostal(raw: string): boolean {
  const trimmed = raw.trim()
  if (trimmed.length < 2 || trimmed.length > 16) return false
  return /^[\p{L}\p{N}][\p{L}\p{N}\s'-]*$/u.test(trimmed)
}

/**
 * True when the text matches the selected country, or any supported
 * country when no country was chosen. Used by forms that only have a
 * postal box.
 */
export function acceptPostalCode(input: string, country?: string): boolean {
  const raw = input.trim()
  if (!raw) return false
  if (country) return detectPostalCode(raw, country) !== null
  if (detectPostalCode(raw, 'US')) return true
  if (/^\d{6}$/.test(raw.replace(/\s+/g, ''))) return detectPostalCode(raw, 'IN') !== null
  for (const item of ALL_COUNTRIES) {
    if (!item.postalPattern) continue
    const detected = detectPostalCode(raw, item.iso2)
    if (detected && detected.country === item.iso2) return true
  }
  if (detectPostalCode(raw, 'GB')) return true
  return false
}

/** Key stored for zip_codes lookup. US ZIP+4 keeps the first five digits. */
export function postalLookupKey(zip: string, country: string): string {
  const raw = (zip || '').trim()
  if (!raw) return ''
  if (normalizeCountryHint(country) === 'US') return raw.slice(0, 5)
  return raw
}

/**
 * Validate a postal code format without looking it up in the database.
 * Returns a user-friendly error message, or null if the format is valid.
 * Blank is valid only where a country does not use postal codes.
 */
export function validatePostalFormat(input: string, country: string): string | null {
  const field = postalFieldFor(country)
  const raw = input.trim()
  if (!raw) {
    if (!field.required) return null
    const name = field.label.toLowerCase()
    return `Please enter your ${name}.`
  }
  const detection = detectPostalCode(raw, country)
  if (detection) return null
  const code = normalizeCountryHint(country)
  switch (code) {
    case 'US': return 'Please enter a valid 5-digit ZIP code.'
    case 'CA': return 'Please enter a valid postal code (e.g. V5K 1A1).'
    case 'GB': return 'Please enter a valid postcode (e.g. SW1A 1AA).'
    case 'NZ': return 'Please enter a valid 4-digit postcode.'
    case 'AU': return 'Please enter a valid 4-digit postcode.'
    case 'IN': return 'Please enter a valid 6-digit PIN code.'
    default: return `Please enter a valid ${field.label.toLowerCase()}.`
  }
}
