/**
 * Country-aware state/province/region resolver.
 *
 * For US: validates against the 50 states + DC. Rejects anything else.
 * For CA: validates against Canadian provinces/territories.
 * For GB: accepts the stored region code (ENG, SCT, WLS, NIR) or county names.
 * For NZ: accepts the stored region code.
 *
 * This is the ONLY way to resolve state/province input for database queries.
 * The doctors.state column stores abbreviation codes. Never query with full names.
 */

// ── US States ──

const US_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'district of columbia': 'DC', 'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI',
  'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME',
  'maryland': 'MD', 'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN',
  'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE',
  'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX',
  'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
  'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
}

const US_VALID_CODES = new Set(Object.values(US_NAME_TO_CODE))

const US_SPELL_FIX: Record<string, string> = {
  'conneticut': 'CT', 'massachucetts': 'MA', 'massachusets': 'MA',
  'pensylvania': 'PA', 'pensilvania': 'PA', 'californai': 'CA',
  'flordia': 'FL', 'goergia': 'GA', 'illnois': 'IL', 'michagan': 'MI',
  'minesota': 'MN', 'misouri': 'MO', 'missisipi': 'MS', 'tennesee': 'TN',
  'tennesse': 'TN', 'virgina': 'VA', 'wiscosin': 'WI', 'arizonia': 'AZ',
  'colorodo': 'CO', 'louisianna': 'LA', 'oklohoma': 'OK', 'oregeon': 'OR',
  'washingon': 'WA', 'northcarolina': 'NC', 'southcarolina': 'SC',
  'newyork': 'NY', 'newjersey': 'NJ',
}

// ── Canadian Provinces ──

const CA_NAME_TO_CODE: Record<string, string> = {
  'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB',
  'new brunswick': 'NB', 'newfoundland and labrador': 'NL', 'newfoundland': 'NL',
  'nova scotia': 'NS', 'northwest territories': 'NT', 'nunavut': 'NU',
  'ontario': 'ON', 'prince edward island': 'PE', 'quebec': 'QC',
  'saskatchewan': 'SK', 'yukon': 'YT',
}

const CA_VALID_CODES = new Set(Object.values(CA_NAME_TO_CODE))

// ── UK Regions ──

const GB_VALID_CODES = new Set([
  'ENG', 'SCT', 'WLS', 'NIR',  // GeoNames region codes
  // Also accept county-level codes that might be stored
])

const GB_NAME_TO_CODE: Record<string, string> = {
  'england': 'ENG', 'scotland': 'SCT', 'wales': 'WLS', 'northern ireland': 'NIR',
}

// ── NZ Regions ──
// GeoNames uses codes like E7 (Auckland), G2 (Wellington), etc.
// We accept any stored value for NZ since the codes are opaque.
const NZ_VALID_CODES = new Set([
  'E7', 'E8', 'E9', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9',
  'G1', 'G2', 'G3',
  // Also accept region names
])

const NZ_NAME_TO_CODE: Record<string, string> = {
  'auckland': 'E7', 'wellington': 'G2', 'canterbury': 'F4',
  'waikato': 'E8', 'bay of plenty': 'E9', 'otago': 'F9',
}

// ── Main resolver ──

/**
 * Resolve a state/province/region input to its canonical code.
 * Country defaults to 'US' for backwards compatibility.
 *
 * Returns the code or null if unresolvable for the given country.
 */
export function resolveStateCode(input: string, country: string = 'US'): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase()
  const lower = trimmed.toLowerCase()

  switch (country.toUpperCase()) {
    case 'US': {
      // Valid 2-letter code
      if (upper.length === 2 && US_VALID_CODES.has(upper)) return upper
      // Full name
      if (US_NAME_TO_CODE[lower]) return US_NAME_TO_CODE[lower]
      // Spell fix
      const noSpace = lower.replace(/\s+/g, '')
      if (US_SPELL_FIX[noSpace]) return US_SPELL_FIX[noSpace]
      if (US_SPELL_FIX[lower]) return US_SPELL_FIX[lower]
      // Substring match (only if exactly one state matches)
      const matches = Object.entries(US_NAME_TO_CODE).filter(([name]) => name.includes(lower))
      if (matches.length === 1) return matches[0][1]
      return null
    }

    case 'CA': {
      if (upper.length === 2 && CA_VALID_CODES.has(upper)) return upper
      if (CA_NAME_TO_CODE[lower]) return CA_NAME_TO_CODE[lower]
      return null
    }

    case 'GB': {
      if (GB_VALID_CODES.has(upper)) return upper
      if (GB_NAME_TO_CODE[lower]) return GB_NAME_TO_CODE[lower]
      // UK counties/regions are stored as-is from GeoNames, accept if short enough
      if (upper.length <= 20) return upper
      return null
    }

    case 'NZ': {
      if (NZ_VALID_CODES.has(upper)) return upper
      if (NZ_NAME_TO_CODE[lower]) return NZ_NAME_TO_CODE[lower]
      // NZ region codes are opaque, accept stored values
      if (upper.length <= 10) return upper
      return null
    }

    default:
      return null
  }
}

/** For display: convert code to full name. Country defaults to US. */
export function stateCodeToName(code: string, country: string = 'US'): string {
  const upper = code.toUpperCase()
  const countryUpper = country.toUpperCase()

  if (countryUpper === 'US') {
    const entry = Object.entries(US_NAME_TO_CODE).find(([, c]) => c === upper)
    return entry ? entry[0].replace(/\b\w/g, c => c.toUpperCase()) : code
  }
  if (countryUpper === 'CA') {
    const entry = Object.entries(CA_NAME_TO_CODE).find(([, c]) => c === upper)
    return entry ? entry[0].replace(/\b\w/g, c => c.toUpperCase()) : code
  }
  if (countryUpper === 'GB') {
    const entry = Object.entries(GB_NAME_TO_CODE).find(([, c]) => c === upper)
    return entry ? entry[0].replace(/\b\w/g, c => c.toUpperCase()) : code
  }
  if (countryUpper === 'NZ') {
    const entry = Object.entries(NZ_NAME_TO_CODE).find(([, c]) => c === upper)
    return entry ? entry[0].replace(/\b\w/g, c => c.toUpperCase()) : code
  }
  return code
}

/**
 * Detect which country a postal code likely belongs to, based on format.
 * Returns ISO country code or null if ambiguous.
 */
export function detectPostalCountry(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // US: 5 digits, optionally +4
  if (/^\d{5}(-\d{4})?$/.test(trimmed)) return 'US'

  // CA: A1A 1A1 or A1A1A1 (letter-digit-letter space? digit-letter-digit)
  if (/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(trimmed)) return 'CA'
  // CA FSA only (3 chars: letter-digit-letter)
  if (/^[A-Za-z]\d[A-Za-z]$/.test(trimmed)) return 'CA'

  // UK: various formats, but always starts with 1-2 letters then digit(s)
  // Full: SW1A 1AA, M1 1AA, B33 8TH
  // Outward only: SW1A, M1, B33, EC1
  if (/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/.test(trimmed)) return 'GB'
  if (/^[A-Za-z]{1,2}\d[A-Za-z\d]?$/.test(trimmed)) return 'GB'

  // NZ: 4 digits (ambiguous with US partial, but handled with region context by caller)
  if (/^\d{4}$/.test(trimmed)) return 'NZ'  // caller should cross-check with region

  return null
}
