/**
 * Detect postal code format and country from a raw input string.
 *
 * Handles US (5 digit, ZIP+4), CA (FSA or full), GB (outward or full),
 * NZ (4 digit), AU (4 digit). NZ and AU are both 4-digit and require
 * a regionHint to disambiguate.
 *
 * All postal codes are strings, never numbers. Leading zeros are preserved.
 *
 * Used by: /list signup, /api/subscribe, resolve-city.ts
 */

export interface PostalDetection {
  /** The normalized code to look up in zip_codes (e.g. FSA for CA, outward for GB) */
  code: string
  /** ISO 3166-1 alpha-2 */
  country: string
}

/**
 * Detect postal code format from raw input.
 *
 * @param input - The raw postal code string from the user
 * @param regionHint - ISO country code hint from the region switcher (US, CA, GB, NZ, AU)
 * @returns Detection result or null if not recognized
 */
export function detectPostalCode(input: string, regionHint: string = 'US'): PostalDetection | null {
  const raw = input.trim()
  if (!raw) return null

  // Collapse internal whitespace for pattern matching
  const collapsed = raw.replace(/\s+/g, '').toUpperCase()

  // US: 5-digit ZIP, optionally +4
  const usMatch = collapsed.match(/^(\d{5})(?:-?\d{4})?$/)
  if (usMatch) {
    // Could be US or could be a 5-digit that looks like AU (AU is 4 digits, so 5 digits is always US)
    return { code: usMatch[1], country: 'US' }
  }

  // CA: full postal code A1A1A1 or FSA A1A
  const caFull = collapsed.match(/^([A-Z]\d[A-Z])\d[A-Z]\d$/)
  if (caFull) return { code: caFull[1], country: 'CA' }
  const caFsa = collapsed.match(/^([A-Z]\d[A-Z])$/)
  if (caFsa) return { code: caFsa[1], country: 'CA' }

  // GB: outward code (1-2 letters + digit + optional letter/digit), optionally with inward
  // Must check AFTER CA since some patterns overlap
  const withSpace = raw.trim().toUpperCase()
  const gbFull = withSpace.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s?\d[A-Z]{2}$/)
  if (gbFull) return { code: gbFull[1], country: 'GB' }
  const gbOutward = withSpace.match(/^([A-Z]{1,2}\d[A-Z\d]?)$/)
  // Only treat as GB if it's NOT a CA FSA (A1A pattern)
  if (gbOutward && !caFsa) return { code: gbOutward[1], country: 'GB' }

  // NZ: 4-digit (only if region hint is NZ)
  if (/^\d{4}$/.test(collapsed) && regionHint === 'NZ') {
    return { code: collapsed, country: 'NZ' }
  }

  // AU: 4-digit (only if region hint is AU)
  if (/^\d{4}$/.test(collapsed) && regionHint === 'AU') {
    return { code: collapsed, country: 'AU' }
  }

  // 4-digit ambiguous (could be NZ or AU) — if no region hint, can't determine
  if (/^\d{4}$/.test(collapsed) && (regionHint !== 'US' && regionHint !== 'CA' && regionHint !== 'GB')) {
    // Default to AU since we just added it
    return { code: collapsed, country: regionHint === 'NZ' ? 'NZ' : 'AU' }
  }

  return null
}

/**
 * Validate a postal code format without looking it up in the database.
 * Returns a user-friendly error message or null if the format is valid.
 */
export function validatePostalFormat(input: string, country: string): string | null {
  const raw = input.trim()
  if (!raw) return 'Please enter your postal code.'

  const detection = detectPostalCode(raw, country)
  if (detection) return null // Valid format

  // Give country-specific guidance
  switch (country) {
    case 'US': return 'Please enter a valid 5-digit ZIP code.'
    case 'CA': return 'Please enter a valid Canadian postal code (e.g. V5K 1A1).'
    case 'GB': return 'Please enter a valid UK postcode (e.g. SW1A 1AA).'
    case 'NZ': return 'Please enter a valid 4-digit NZ postcode.'
    case 'AU': return 'Please enter a valid 4-digit Australian postcode.'
    default: return 'Please enter a valid postal code.'
  }
}
