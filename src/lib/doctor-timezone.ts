/**
 * Maps doctor state/country to IANA timezone.
 * Uses Intl.DateTimeFormat for DST-correct local time.
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
  // Territories
  PR: 'America/Puerto_Rico', GU: 'Pacific/Guam', VI: 'America/Virgin',
  AS: 'Pacific/Pago_Pago', MP: 'Pacific/Guam',
}

const CA_PROVINCE_TZ: Record<string, string> = {
  AB: 'America/Edmonton', BC: 'America/Vancouver', MB: 'America/Winnipeg',
  NB: 'America/Moncton', NL: 'America/St_Johns', NS: 'America/Halifax',
  NT: 'America/Yellowknife', NU: 'America/Iqaluit', ON: 'America/Toronto',
  PE: 'America/Halifax', QC: 'America/Toronto', SK: 'America/Regina',
  YT: 'America/Whitehorse',
  // Full names
  Alberta: 'America/Edmonton', 'British Columbia': 'America/Vancouver',
}

const COUNTRY_TZ: Record<string, string> = {
  GB: 'Europe/London', ENG: 'Europe/London',
  NZ: 'Pacific/Auckland', AU: 'Australia/Sydney',
  DE: 'Europe/Berlin', IE: 'Europe/Dublin', FR: 'Europe/Paris',
  ZA: 'Africa/Johannesburg', NG: 'Africa/Lagos',
  SG: 'Asia/Singapore', JP: 'Asia/Tokyo',
}

/**
 * Get IANA timezone for a doctor.
 * Returns null if timezone cannot be determined (caller should hold, not guess).
 */
export function getDoctorTimezone(state: string | null, country: string | null): string | null {
  const c = country || 'US'

  if (c === 'US' && state) {
    return US_STATE_TZ[state.toUpperCase()] || null
  }

  if (c === 'CA' && state) {
    return CA_PROVINCE_TZ[state] || CA_PROVINCE_TZ[state.toUpperCase()] || null
  }

  // UK regions
  if (c === 'GB' || state === 'ENG' || state === 'SCT' || state === 'WLS') {
    return 'Europe/London'
  }

  return COUNTRY_TZ[c] || COUNTRY_TZ[state || ''] || null
}

/**
 * Get the current local hour (0-23) for a timezone.
 * Returns null if timezone is invalid.
 */
export function getLocalHour(timezone: string): number | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })
    return parseInt(formatter.format(new Date()))
  } catch {
    return null
  }
}

/**
 * Check if it is currently quiet hours in the given timezone.
 */
export function isQuietHours(timezone: string, quietStart: number, quietEnd: number): boolean {
  const hour = getLocalHour(timezone)
  if (hour === null) return true // Cannot determine → treat as quiet (hold, don't send)

  if (quietStart > quietEnd) {
    // e.g. 21-8: quiet if hour >= 21 OR hour < 8
    return hour >= quietStart || hour < quietEnd
  }
  return hour >= quietStart && hour < quietEnd
}
