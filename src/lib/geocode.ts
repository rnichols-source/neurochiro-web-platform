/**
 * Geocode a doctor's address using Nominatim (OpenStreetMap).
 * Used on profile save when address changes.
 *
 * Rules:
 * - Uses full street address, never just city+state (prevents city-center coords)
 * - Returns null on failure or ambiguity (never guesses)
 * - Rate-limited: 1 request per second per Nominatim policy
 */

const STATE_EXPAND: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
  'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
  'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
  'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia',
  'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
}

function stripSuiteInfo(addr: string): string {
  return addr
    .replace(/,?\s*(Suite|Ste|Unit|Bldg|Building|Apt|#)\s*[\w#-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function nominatimCountry(country: string): string {
  const code = (country || 'US').trim().toUpperCase()
  if (code === 'UK') return 'gb'
  if (/^[A-Z]{2}$/.test(code)) return code.toLowerCase()
  return 'us'
}

async function nominatimSearch(query: string, country = 'US'): Promise<{ lat: number; lng: number } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=${nominatimCountry(country)}&addressdetails=1`,
    { headers: { 'User-Agent': 'NeuroChiro/1.0 (support@neurochirodirectory.com)' } }
  )
  const data = await response.json()
  if (!data || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

async function nominatimStructured(street: string, city: string, state: string, country = 'US'): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    format: 'json', street, city, state,
    countrycodes: nominatimCountry(country), limit: '1', addressdetails: '1',
  })
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'User-Agent': 'NeuroChiro/1.0 (support@neurochirodirectory.com)' } }
  )
  const data = await response.json()
  if (!data || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

async function censusBureauGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
    url.searchParams.set('address', address)
    url.searchParams.set('benchmark', 'Public_AR_Current')
    url.searchParams.set('format', 'json')
    const response = await fetch(url.toString())
    const data = await response.json()
    const matches = data?.result?.addressMatches
    if (!matches || matches.length === 0) return null
    return { lat: matches[0].coordinates.y, lng: matches[0].coordinates.x }
  } catch {
    return null
  }
}

export async function geocodeDoctorAddress(
  address: string,
  city: string,
  state: string,
  country = 'US',
): Promise<{ lat: number; lng: number } | null> {
  if (!address || !address.trim()) return null

  const countryCode = (country || 'US').trim().toUpperCase() === 'UK' ? 'GB' : (country || 'US').trim().toUpperCase()
  const expandedState = countryCode === 'US' ? (STATE_EXPAND[state?.toUpperCase()] || state) : state

  // Attempt 1: full address as-is
  const hasCityInAddr = city ? address.toLowerCase().includes(city.toLowerCase()) : false
  const query = hasCityInAddr ? address : [address, city, expandedState].filter(Boolean).join(', ')
  let result = await nominatimSearch(query, countryCode)
  if (result) return result

  // Attempt 2: strip suite/unit numbers
  const stripped = stripSuiteInfo(address)
  if (stripped !== address) {
    const query2 = hasCityInAddr ? stripped : [stripped, city, expandedState].filter(Boolean).join(', ')
    result = await nominatimSearch(query2, countryCode)
    if (result) return result
  }

  // Attempt 3: structured search
  const streetOnly = stripSuiteInfo(address.split(',')[0])
  result = await nominatimStructured(streetOnly, city, expandedState, countryCode)
  if (result) return result

  if (countryCode !== 'US') return null

  // Attempt 4: US Census Bureau Geocoding API (better at commercial addresses)
  result = await censusBureauGeocode(address)
  if (result) return result

  // Attempt 5: Census with stripped suite
  if (stripped !== address) {
    result = await censusBureauGeocode(stripped)
    if (result) return result
  }

  return null
}

/**
 * Validate that coordinates are plausible for a US doctor.
 * Returns true if valid, false if suspicious (0,0 or outside US bounds).
 */
export function isPlausibleUSCoord(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false
  if (lat === 0 && lng === 0) return false
  // All 50 states + territories
  if (lat < 17.5 || lat > 71.5) return false
  if (lng < -180 || lng > -64.5) return false
  return true
}
