/**
 * Location validation for doctor profiles.
 * Prevents dirty city/state data from entering the database.
 */

const VALID_US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
]);

// International regions we recognize (from existing doctor data)
const VALID_INTERNATIONAL_REGIONS = new Set([
  'Alberta', 'British Columbia', 'Manitoba', 'Ontario', 'Quebec',
  'Saskatchewan', 'London', 'Lancashire', 'UK', 'Wellington',
]);

const CITY_BANNED_PATTERNS = /\d{4,}|Suite\s|Ste\s|Unit\s|#\d/i;

export function validateState(state: string): { valid: boolean; error?: string } {
  if (!state || !state.trim()) {
    return { valid: false, error: 'State is required.' };
  }
  const trimmed = state.trim();
  if (VALID_US_STATES.has(trimmed.toUpperCase())) return { valid: true };
  if (VALID_INTERNATIONAL_REGIONS.has(trimmed)) return { valid: true };
  return {
    valid: false,
    error: `"${trimmed}" is not a valid US state abbreviation. Use the 2-letter code (e.g. SC, TX, CA).`,
  };
}

export function validateCity(city: string): { valid: boolean; error?: string } {
  if (!city || !city.trim()) {
    return { valid: false, error: 'City is required.' };
  }
  const trimmed = city.trim();
  if (CITY_BANNED_PATTERNS.test(trimmed)) {
    return {
      valid: false,
      error: 'City should be a city name only. Do not include street addresses, suite numbers, or ZIP codes.',
    };
  }
  return { valid: true };
}

export function isValidUSState(state: string): boolean {
  return VALID_US_STATES.has(state.toUpperCase());
}
