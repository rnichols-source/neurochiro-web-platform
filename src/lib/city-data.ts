/**
 * Static city data for /chiropractor/[city]-[state] pages.
 *
 * Two tiers:
 * - Doctor cities: every US city where we have a verified doctor
 * - Empty metros: top 25 US metros without doctors (waitlist pages)
 *
 * Coordinates are used for radius-based doctor queries (30 mi).
 * Updated via scripts; don't hand-edit.
 */

export interface CityMeta {
  city: string;
  state: string;
  slug: string;
  lat: number;
  lng: number;
  hasDoctors: boolean;
}

export function cityToSlug(city: string, state: string): string {
  return (city.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + state.toLowerCase())
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugToCity(slug: string): { city: string; state: string } | null {
  // State is always the last 2 chars after the final hyphen
  const match = slug.match(/^(.+)-([a-z]{2})$/);
  if (!match) return null;
  const city = match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const state = match[2].toUpperCase();
  return { city, state };
}

// Top 25 US metros without doctors (waitlist pages)
export const EMPTY_METROS: CityMeta[] = [
  { city: 'Los Angeles', state: 'CA', slug: 'los-angeles-ca', lat: 34.0522, lng: -118.2437, hasDoctors: false },
  { city: 'Chicago', state: 'IL', slug: 'chicago-il', lat: 41.8781, lng: -87.6298, hasDoctors: false },
  { city: 'Dallas', state: 'TX', slug: 'dallas-tx', lat: 32.7767, lng: -96.7970, hasDoctors: false },
  { city: 'Philadelphia', state: 'PA', slug: 'philadelphia-pa', lat: 39.9526, lng: -75.1652, hasDoctors: false },
  { city: 'Washington', state: 'DC', slug: 'washington-dc', lat: 38.9072, lng: -77.0369, hasDoctors: false },
  { city: 'Miami', state: 'FL', slug: 'miami-fl', lat: 25.7617, lng: -80.1918, hasDoctors: false },
  { city: 'Boston', state: 'MA', slug: 'boston-ma', lat: 42.3601, lng: -71.0589, hasDoctors: false },
  { city: 'Phoenix', state: 'AZ', slug: 'phoenix-az', lat: 33.4484, lng: -112.0740, hasDoctors: false },
  { city: 'San Francisco', state: 'CA', slug: 'san-francisco-ca', lat: 37.7749, lng: -122.4194, hasDoctors: false },
  { city: 'Detroit', state: 'MI', slug: 'detroit-mi', lat: 42.3314, lng: -83.0458, hasDoctors: false },
  { city: 'Minneapolis', state: 'MN', slug: 'minneapolis-mn', lat: 44.9778, lng: -93.2650, hasDoctors: false },
  { city: 'Denver', state: 'CO', slug: 'denver-co', lat: 39.7392, lng: -104.9903, hasDoctors: false },
  { city: 'Tampa', state: 'FL', slug: 'tampa-fl', lat: 27.9506, lng: -82.4572, hasDoctors: false },
  { city: 'St. Louis', state: 'MO', slug: 'st-louis-mo', lat: 38.6270, lng: -90.1994, hasDoctors: false },
  { city: 'Baltimore', state: 'MD', slug: 'baltimore-md', lat: 39.2904, lng: -76.6122, hasDoctors: false },
  { city: 'Orlando', state: 'FL', slug: 'orlando-fl', lat: 28.5383, lng: -81.3792, hasDoctors: false },
  { city: 'San Antonio', state: 'TX', slug: 'san-antonio-tx', lat: 29.4241, lng: -98.4936, hasDoctors: false },
  { city: 'Sacramento', state: 'CA', slug: 'sacramento-ca', lat: 38.5816, lng: -121.4944, hasDoctors: false },
  { city: 'Pittsburgh', state: 'PA', slug: 'pittsburgh-pa', lat: 40.4406, lng: -79.9959, hasDoctors: false },
  { city: 'Las Vegas', state: 'NV', slug: 'las-vegas-nv', lat: 36.1699, lng: -115.1398, hasDoctors: false },
  { city: 'Cincinnati', state: 'OH', slug: 'cincinnati-oh', lat: 39.1031, lng: -84.5120, hasDoctors: false },
  { city: 'Cleveland', state: 'OH', slug: 'cleveland-oh', lat: 41.4993, lng: -81.6944, hasDoctors: false },
  { city: 'Indianapolis', state: 'IN', slug: 'indianapolis-in', lat: 39.7684, lng: -86.1581, hasDoctors: false },
  { city: 'Milwaukee', state: 'WI', slug: 'milwaukee-wi', lat: 43.0389, lng: -87.9065, hasDoctors: false },
];

/** Full list of US state abbreviation to name */
export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
