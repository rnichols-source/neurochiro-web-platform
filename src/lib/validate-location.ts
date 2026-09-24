/**
 * Country-aware location validation for doctor profiles.
 * Prevents dirty city/state data from entering the database.
 */

const VALID_US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
])

const VALID_CA_PROVINCES = new Set([
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
])

const VALID_GB_REGIONS = new Set([
  'ENG', 'SCT', 'WLS', 'NIR',
  // Also accept county names commonly stored
  'Lancashire', 'London', 'Greater Manchester', 'West Midlands',
  'South Yorkshire', 'West Yorkshire', 'Merseyside',
])

// NZ uses opaque GeoNames region codes (E7, G2, etc.)
// Accept any short code or known region name
const VALID_NZ_REGIONS = new Set([
  'E7', 'E8', 'E9', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9',
  'G1', 'G2', 'G3',
  'Auckland', 'Wellington', 'Canterbury', 'Waikato', 'Bay of Plenty', 'Otago',
])

const CITY_BANNED_PATTERNS = /\d{4,}|Suite\s|Ste\s|Unit\s|#\d/i

/**
 * Validate state/province/region for a given country.
 * Country defaults to 'US' for backwards compatibility.
 */
export function validateState(state: string, country: string = 'US'): { valid: boolean; error?: string } {
  if (!state || !state.trim()) {
    return { valid: false, error: 'State/province is required.' }
  }
  const trimmed = state.trim()
  const upper = trimmed.toUpperCase()
  const c = country.toUpperCase()

  if (c === 'US') {
    if (VALID_US_STATES.has(upper)) return { valid: true }
    return { valid: false, error: `"${trimmed}" is not a valid US state. Use the 2-letter code (e.g. SC, TX, CA).` }
  }

  if (c === 'CA') {
    if (VALID_CA_PROVINCES.has(upper)) return { valid: true }
    return { valid: false, error: `"${trimmed}" is not a valid Canadian province. Use the 2-letter code (e.g. AB, BC, ON).` }
  }

  if (c === 'GB') {
    if (VALID_GB_REGIONS.has(upper) || VALID_GB_REGIONS.has(trimmed)) return { valid: true }
    // Accept any string under 30 chars for UK counties (too many to enumerate)
    if (trimmed.length <= 30 && /^[A-Za-z\s]+$/.test(trimmed)) return { valid: true }
    return { valid: false, error: `"${trimmed}" is not a valid UK region.` }
  }

  if (c === 'NZ') {
    if (VALID_NZ_REGIONS.has(upper) || VALID_NZ_REGIONS.has(trimmed)) return { valid: true }
    // Accept any short code for NZ
    if (trimmed.length <= 20 && /^[A-Za-z0-9\s]+$/.test(trimmed)) return { valid: true }
    return { valid: false, error: `"${trimmed}" is not a valid NZ region.` }
  }

  // Unknown country — reject
  return { valid: false, error: `Unsupported country "${country}".` }
}

export function validateCity(city: string): { valid: boolean; error?: string } {
  if (!city || !city.trim()) {
    return { valid: false, error: 'City is required.' }
  }
  const trimmed = city.trim()
  if (CITY_BANNED_PATTERNS.test(trimmed)) {
    return {
      valid: false,
      error: 'City should be a city name only. Do not include street addresses, suite numbers, or ZIP codes.',
    }
  }
  return { valid: true }
}

export function isValidUSState(state: string): boolean {
  return VALID_US_STATES.has(state.toUpperCase())
}
