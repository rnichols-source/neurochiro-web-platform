/**
 * Maps a doctor's state and country to an IANA timezone.
 * Accepts 2-letter codes and full US state / Canadian province names.
 * Callers that must not hold a lead forever pass a fallback.
 */

const US_STATE_TZ: Record<string, string> = {
  AL: 'America/Chicago', AK: 'America/Anchorage', AZ: 'America/Phoenix',
  AR: 'America/Chicago', CA: 'America/Los_Angeles', CO: 'America/Denver',
  CT: 'America/New_York', DE: 'America/New_York', FL: 'America/New_York',
  GA: 'America/New_York', HI: 'Pacific/Honolulu', ID: 'America/Boise',
  IL: 'America/Chicago', IN: 'America/Indiana/Indianapolis', IA: 'America/Chicago',
  KS: 'America/Chicago', KY: 'America/New_York', LA: 'America/Chicago',
  ME: 'America/New_York', MD: 'America/New_York', MA: 'America/New_York',
  MI: 'America/Detroit', MN: 'America/Chicago', MS: 'America/Chicago',
  MO: 'America/Chicago', MT: 'America/Denver', NE: 'America/Chicago',
  NV: 'America/Los_Angeles', NH: 'America/New_York', NJ: 'America/New_York',
  NM: 'America/Denver', NY: 'America/New_York', NC: 'America/New_York',
  ND: 'America/Chicago', OH: 'America/New_York', OK: 'America/Chicago',
  OR: 'America/Los_Angeles', PA: 'America/New_York', RI: 'America/New_York',
  SC: 'America/New_York', SD: 'America/Chicago', TN: 'America/Chicago',
  TX: 'America/Chicago', UT: 'America/Denver', VT: 'America/New_York',
  VA: 'America/New_York', WA: 'America/Los_Angeles', WV: 'America/New_York',
  WI: 'America/Chicago', WY: 'America/Denver', DC: 'America/New_York',
  PR: 'America/Puerto_Rico', GU: 'Pacific/Guam', VI: 'America/Virgin',
  AS: 'Pacific/Pago_Pago', MP: 'Pacific/Guam',
}

const US_STATE_NAMES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY', 'district of columbia': 'DC', 'washington dc': 'DC', 'washington d c': 'DC',
  'puerto rico': 'PR', guam: 'GU', 'us virgin islands': 'VI', 'virgin islands': 'VI',
  'american samoa': 'AS', 'northern mariana islands': 'MP',
}

const CA_PROVINCE_TZ: Record<string, string> = {
  AB: 'America/Edmonton', BC: 'America/Vancouver', MB: 'America/Winnipeg',
  NB: 'America/Moncton', NL: 'America/St_Johns', NS: 'America/Halifax',
  NT: 'America/Yellowknife', NU: 'America/Iqaluit', ON: 'America/Toronto',
  PE: 'America/Halifax', QC: 'America/Toronto', SK: 'America/Regina',
  YT: 'America/Whitehorse',
}

const CA_PROVINCE_NAMES: Record<string, string> = {
  alberta: 'AB', 'british columbia': 'BC', manitoba: 'MB', 'new brunswick': 'NB',
  'newfoundland and labrador': 'NL', newfoundland: 'NL', labrador: 'NL',
  'nova scotia': 'NS', 'northwest territories': 'NT', nunavut: 'NU', ontario: 'ON',
  'prince edward island': 'PE', quebec: 'QC', 'québec': 'QC', saskatchewan: 'SK', yukon: 'YT',
}

const COUNTRY_TZ: Record<string, string> = {
  GB: 'Europe/London', UK: 'Europe/London', ENG: 'Europe/London',
  NZ: 'Pacific/Auckland', AU: 'Australia/Sydney',
  DE: 'Europe/Berlin', IE: 'Europe/Dublin', FR: 'Europe/Paris',
  ZA: 'Africa/Johannesburg', NG: 'Africa/Lagos',
  SG: 'Asia/Singapore', JP: 'Asia/Tokyo',
}

const COUNTRY_NAMES: Record<string, string> = {
  us: 'US', usa: 'US', 'united states': 'US', 'united states of america': 'US',
  ca: 'CA', canada: 'CA',
  gb: 'GB', uk: 'GB', 'united kingdom': 'GB', 'great britain': 'GB',
  england: 'GB', scotland: 'GB', wales: 'GB', 'northern ireland': 'GB',
  au: 'AU', australia: 'AU',
  nz: 'NZ', 'new zealand': 'NZ',
  de: 'DE', germany: 'DE',
  ie: 'IE', ireland: 'IE',
  fr: 'FR', france: 'FR',
  za: 'ZA', 'south africa': 'ZA',
  ng: 'NG', nigeria: 'NG',
  sg: 'SG', singapore: 'SG',
  jp: 'JP', japan: 'JP',
}

function normalizeKey(value: string): string {
  return value.trim().replace(/\./g, '').replace(/\s+/g, ' ').toLowerCase()
}

function countryCode(country: string | null): string {
  const key = normalizeKey(country || 'US')
  if (COUNTRY_NAMES[key]) return COUNTRY_NAMES[key]
  const upper = key.toUpperCase()
  if (COUNTRY_TZ[upper] || upper === 'US' || upper === 'CA') return upper
  return upper
}

function regionCode(state: string, names: Record<string, string>, zones: Record<string, string>): string | null {
  const compact = state.trim().replace(/\./g, '').replace(/\s+/g, '')
  const upper = compact.toUpperCase()
  if (zones[upper]) return upper
  const named = names[normalizeKey(state)]
  if (named && zones[named]) return named
  return null
}

/**
 * Timezone from state and country.
 * Returns null when it cannot be determined. Pass `fallback` to never hold a lead.
 */
export function getDoctorTimezone(
  state: string | null,
  country: string | null,
  fallback?: string | null,
): string | null {
  const resolved = explainDoctorTimezone(state, country, fallback || null)
  return resolved.timezone
}

export function explainDoctorTimezone(
  state: string | null,
  country: string | null,
  fallback?: string | null,
): { timezone: string | null; usedFallback: boolean } {
  const code = countryCode(country)
  const region = state?.trim() ? state : null

  if ((code === 'US' || code === 'USA') && region) {
    const stateCode = regionCode(region, US_STATE_NAMES, US_STATE_TZ)
    if (stateCode) return { timezone: US_STATE_TZ[stateCode], usedFallback: false }
  }

  if (code === 'CA' && region) {
    const province = regionCode(region, CA_PROVINCE_NAMES, CA_PROVINCE_TZ)
    if (province) return { timezone: CA_PROVINCE_TZ[province], usedFallback: false }
  }

  if (code === 'GB' || region === 'ENG' || region === 'SCT' || region === 'WLS') {
    return { timezone: 'Europe/London', usedFallback: false }
  }

  const byCountry = COUNTRY_TZ[code]
  if (byCountry) return { timezone: byCountry, usedFallback: false }

  if (fallback) return { timezone: fallback, usedFallback: true }
  return { timezone: null, usedFallback: false }
}

/**
 * Current local hour (0-23) in a timezone. Returns null if the timezone is invalid.
 */
export function getLocalHour(timezone: string, now: Date = new Date()): number | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })
    const hour = parseInt(formatter.format(now), 10)
    if (Number.isNaN(hour)) return null
    return hour % 24
  } catch {
    return null
  }
}

/**
 * Quiet hours in the doctor's local time.
 * An unreadable timezone is treated as quiet so the caller can substitute a fallback
 * and call again. The lead cron always passes a resolved timezone.
 */
export function isQuietHours(timezone: string, quietStart: number, quietEnd: number, now: Date = new Date()): boolean {
  const hour = getLocalHour(timezone, now)
  if (hour === null) return true

  if (quietStart > quietEnd) {
    return hour >= quietStart || hour < quietEnd
  }
  return hour >= quietStart && hour < quietEnd
}
