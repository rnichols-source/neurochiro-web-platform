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

// Doctor cities: real geocoded city center coordinates (Nominatim, 2026-09-23)
// Independent of any doctor record. Do not derive from doctor addresses.
export const DOCTOR_CITIES: CityMeta[] = [
  { city: 'Allen', state: 'TX', slug: 'allen-tx', lat: 33.1032, lng: -96.6706, hasDoctors: true },
  { city: 'Alpharetta', state: 'GA', slug: 'alpharetta-ga', lat: 34.0756, lng: -84.2946, hasDoctors: true },
  { city: 'Altamonte Springs', state: 'FL', slug: 'altamonte-springs-fl', lat: 28.6619, lng: -81.3886, hasDoctors: true },
  { city: 'Anna', state: 'TX', slug: 'anna-tx', lat: 33.3497, lng: -96.5547, hasDoctors: true },
  { city: 'Antioch', state: 'TN', slug: 'antioch-tn', lat: 36.0601, lng: -86.6722, hasDoctors: true },
  { city: 'Atlanta', state: 'GA', slug: 'atlanta-ga', lat: 33.7545, lng: -84.3898, hasDoctors: true },
  { city: 'Aurora', state: 'IL', slug: 'aurora-il', lat: 41.7572, lng: -88.3148, hasDoctors: true },
  { city: 'Austin', state: 'TX', slug: 'austin-tx', lat: 30.2711, lng: -97.7437, hasDoctors: true },
  { city: 'Battle Ground', state: 'WA', slug: 'battle-ground-wa', lat: 45.7814, lng: -122.5337, hasDoctors: true },
  { city: 'Bellingham', state: 'WA', slug: 'bellingham-wa', lat: 48.7544, lng: -122.4788, hasDoctors: true },
  { city: 'Bentonville', state: 'AR', slug: 'bentonville-ar', lat: 36.3729, lng: -94.2088, hasDoctors: true },
  { city: 'Birmingham', state: 'AL', slug: 'birmingham-al', lat: 33.5207, lng: -86.8024, hasDoctors: true },
  { city: 'Bradenton', state: 'FL', slug: 'bradenton-fl', lat: 27.4989, lng: -82.5748, hasDoctors: true },
  { city: 'Brandon', state: 'MS', slug: 'brandon-ms', lat: 32.2731, lng: -89.9868, hasDoctors: true },
  { city: 'Broomfield', state: 'CO', slug: 'broomfield-co', lat: 39.9404, lng: -105.0521, hasDoctors: true },
  { city: 'Canandaigua', state: 'NY', slug: 'canandaigua-ny', lat: 42.8507, lng: -77.3191, hasDoctors: true },
  { city: 'Canyon Country', state: 'CA', slug: 'canyon-country-ca', lat: 34.4233, lng: -118.472, hasDoctors: true },
  { city: 'Carmel', state: 'IN', slug: 'carmel-in', lat: 39.9784, lng: -86.1284, hasDoctors: true },
  { city: 'Cary', state: 'NC', slug: 'cary-nc', lat: 35.7874, lng: -78.7812, hasDoctors: true },
  { city: 'Cedar Park', state: 'TX', slug: 'cedar-park-tx', lat: 30.5217, lng: -97.8278, hasDoctors: true },
  { city: 'Celina', state: 'TX', slug: 'celina-tx', lat: 33.3242, lng: -96.7842, hasDoctors: true },
  { city: 'Charlotte', state: 'NC', slug: 'charlotte-nc', lat: 35.2272, lng: -80.8431, hasDoctors: true },
  { city: 'Clayton', state: 'NC', slug: 'clayton-nc', lat: 35.6507, lng: -78.4564, hasDoctors: true },
  { city: 'Colleyville', state: 'TX', slug: 'colleyville-tx', lat: 32.881, lng: -97.155, hasDoctors: true },
  { city: 'Columbus', state: 'OH', slug: 'columbus-oh', lat: 39.9623, lng: -83.0007, hasDoctors: true },
  { city: 'Costa Mesa', state: 'CA', slug: 'costa-mesa-ca', lat: 33.6633, lng: -117.9033, hasDoctors: true },
  { city: 'Cottonwood', state: 'AZ', slug: 'cottonwood-az', lat: 34.7476, lng: -112.0272, hasDoctors: true },
  { city: 'Decatur', state: 'GA', slug: 'decatur-ga', lat: 30.8737, lng: -84.5741, hasDoctors: true },
  { city: 'Durant', state: 'OK', slug: 'durant-ok', lat: 33.992, lng: -96.3777, hasDoctors: true },
  { city: 'Edwardsville', state: 'IL', slug: 'edwardsville-il', lat: 38.8114, lng: -89.9532, hasDoctors: true },
  { city: 'Export', state: 'PA', slug: 'export-pa', lat: 40.4181, lng: -79.6256, hasDoctors: true },
  { city: 'Fairfield', state: 'NJ', slug: 'fairfield-nj', lat: 40.8837, lng: -74.3069, hasDoctors: true },
  { city: 'Far Hills', state: 'NJ', slug: 'far-hills-nj', lat: 40.6843, lng: -74.6357, hasDoctors: true },
  { city: 'Flowood', state: 'MS', slug: 'flowood-ms', lat: 32.3093, lng: -90.1387, hasDoctors: true },
  { city: 'Folsom', state: 'CA', slug: 'folsom-ca', lat: 38.678, lng: -121.1761, hasDoctors: true },
  { city: 'Fort Collins', state: 'CO', slug: 'fort-collins-co', lat: 40.5872, lng: -105.077, hasDoctors: true },
  { city: 'Fort Mill', state: 'SC', slug: 'fort-mill-sc', lat: 35.0074, lng: -80.9451, hasDoctors: true },
  { city: 'Fort Wayne', state: 'IN', slug: 'fort-wayne-in', lat: 41.08, lng: -85.1386, hasDoctors: true },
  { city: 'Frisco', state: 'TX', slug: 'frisco-tx', lat: 33.1506, lng: -96.8238, hasDoctors: true },
  { city: 'Fuquay-Varina', state: 'NC', slug: 'fuquay-varina-nc', lat: 35.5844, lng: -78.7999, hasDoctors: true },
  { city: 'Georgetown', state: 'TX', slug: 'georgetown-tx', lat: 30.637, lng: -97.6776, hasDoctors: true },
  { city: 'Gilbert', state: 'AZ', slug: 'gilbert-az', lat: 33.3528, lng: -111.789, hasDoctors: true },
  { city: 'Gluckstadt', state: 'MS', slug: 'gluckstadt-ms', lat: 32.5165, lng: -90.1009, hasDoctors: true },
  { city: 'Goose Creek', state: 'SC', slug: 'goose-creek-sc', lat: 32.9961, lng: -80.0387, hasDoctors: true },
  { city: 'Granite Bay', state: 'CA', slug: 'granite-bay-ca', lat: 38.7622, lng: -121.185, hasDoctors: true },
  { city: 'Greenville', state: 'SC', slug: 'greenville-sc', lat: 34.8514, lng: -82.3985, hasDoctors: true },
  { city: 'Greer', state: 'SC', slug: 'greer-sc', lat: 34.9381, lng: -82.2272, hasDoctors: true },
  { city: 'Hillsboro', state: 'OH', slug: 'hillsboro-oh', lat: 39.2023, lng: -83.6116, hasDoctors: true },
  { city: 'Houston', state: 'TX', slug: 'houston-tx', lat: 29.7589, lng: -95.3677, hasDoctors: true },
  { city: 'Huntington Beach', state: 'CA', slug: 'huntington-beach-ca', lat: 33.6783, lng: -118, hasDoctors: true },
  { city: 'Huntsville', state: 'AL', slug: 'huntsville-al', lat: 34.7298, lng: -86.5859, hasDoctors: true },
  { city: 'Irving', state: 'TX', slug: 'irving-tx', lat: 32.8295, lng: -96.9442, hasDoctors: true },
  { city: 'Jackson', state: 'MS', slug: 'jackson-ms', lat: 32.2999, lng: -90.183, hasDoctors: true },
  { city: 'Johns Creek', state: 'GA', slug: 'johns-creek-ga', lat: 34.0182, lng: -84.1902, hasDoctors: true },
  { city: 'Jupiter', state: 'FL', slug: 'jupiter-fl', lat: 26.9342, lng: -80.0942, hasDoctors: true },
  { city: 'Kalispell', state: 'MT', slug: 'kalispell-mt', lat: 48.2022, lng: -114.3153, hasDoctors: true },
  { city: 'Kansas City', state: 'MO', slug: 'kansas-city-mo', lat: 39.1001, lng: -94.5781, hasDoctors: true },
  { city: 'Katy', state: 'TX', slug: 'katy-tx', lat: 29.7858, lng: -95.8244, hasDoctors: true },
  { city: 'Knoxville', state: 'TN', slug: 'knoxville-tn', lat: 35.9604, lng: -83.921, hasDoctors: true },
  { city: 'Lafayette', state: 'LA', slug: 'lafayette-la', lat: 30.2262, lng: -92.0178, hasDoctors: true },
  { city: 'Laguna Hills', state: 'CA', slug: 'laguna-hills-ca', lat: 33.5949, lng: -117.6882, hasDoctors: true },
  { city: 'Macon', state: 'GA', slug: 'macon-ga', lat: 32.8407, lng: -83.6324, hasDoctors: true },
  { city: 'Madison', state: 'MS', slug: 'madison-ms', lat: 32.6308, lng: -90.0041, hasDoctors: true },
  { city: 'Malvern', state: 'PA', slug: 'malvern-pa', lat: 40.0362, lng: -75.5139, hasDoctors: true },
  { city: 'Marietta', state: 'GA', slug: 'marietta-ga', lat: 33.9528, lng: -84.5496, hasDoctors: true },
  { city: 'Mendham Township', state: 'NJ', slug: 'mendham-township-nj', lat: 40.7787, lng: -74.5643, hasDoctors: true },
  { city: 'Middletown', state: 'PA', slug: 'middletown-pa', lat: 40.1701, lng: -74.8852, hasDoctors: true },
  { city: 'Missouri City', state: 'TX', slug: 'missouri-city-tx', lat: 29.6186, lng: -95.5377, hasDoctors: true },
  { city: 'Mount Pleasant', state: 'SC', slug: 'mount-pleasant-sc', lat: 32.7928, lng: -79.8678, hasDoctors: true },
  { city: 'Naples', state: 'FL', slug: 'naples-fl', lat: 26.1422, lng: -81.7943, hasDoctors: true },
  { city: 'Nashville', state: 'TN', slug: 'nashville-tn', lat: 36.1623, lng: -86.7743, hasDoctors: true },
  { city: 'New York', state: 'NY', slug: 'new-york-ny', lat: 40.7127, lng: -74.006, hasDoctors: true },
  { city: 'Newnan', state: 'GA', slug: 'newnan-ga', lat: 33.3807, lng: -84.7997, hasDoctors: true },
  { city: 'Newtown', state: 'PA', slug: 'newtown-pa', lat: 40.2294, lng: -74.9365, hasDoctors: true },
  { city: 'Norfolk', state: 'NE', slug: 'norfolk-ne', lat: 42.0283, lng: -97.417, hasDoctors: true },
  { city: 'Oakdale', state: 'MN', slug: 'oakdale-mn', lat: 44.9856, lng: -92.9646, hasDoctors: true },
  { city: 'Oakland', state: 'CA', slug: 'oakland-ca', lat: 37.8045, lng: -122.2714, hasDoctors: true },
  { city: 'Oklahoma City', state: 'OK', slug: 'oklahoma-city-ok', lat: 35.473, lng: -97.5171, hasDoctors: true },
  { city: 'Olympia', state: 'WA', slug: 'olympia-wa', lat: 47.0451, lng: -122.895, hasDoctors: true },
  { city: 'Orange', state: 'CA', slug: 'orange-ca', lat: 33.7506, lng: -117.8722, hasDoctors: true },
  { city: 'Orem', state: 'UT', slug: 'orem-ut', lat: 40.2982, lng: -111.6944, hasDoctors: true },
  { city: 'Orland Park', state: 'IL', slug: 'orland-park-il', lat: 41.6307, lng: -87.8536, hasDoctors: true },
  { city: 'Park Ridge', state: 'IL', slug: 'park-ridge-il', lat: 42.0112, lng: -87.8406, hasDoctors: true },
  { city: 'Pelham', state: 'AL', slug: 'pelham-al', lat: 33.2857, lng: -86.81, hasDoctors: true },
  { city: 'Pembroke Pines', state: 'FL', slug: 'pembroke-pines-fl', lat: 26.0062, lng: -80.2872, hasDoctors: true },
  { city: 'Plantation', state: 'FL', slug: 'plantation-fl', lat: 26.1276, lng: -80.2331, hasDoctors: true },
  { city: 'Pompano Beach', state: 'FL', slug: 'pompano-beach-fl', lat: 26.2379, lng: -80.1248, hasDoctors: true },
  { city: 'Pontotoc', state: 'MS', slug: 'pontotoc-ms', lat: 34.2115, lng: -89.0383, hasDoctors: true },
  { city: 'Portland', state: 'OR', slug: 'portland-or', lat: 45.5202, lng: -122.6742, hasDoctors: true },
  { city: 'Prescott Valley', state: 'AZ', slug: 'prescott-valley-az', lat: 34.5951, lng: -112.3339, hasDoctors: true },
  { city: 'Queen Creek', state: 'AZ', slug: 'queen-creek-az', lat: 33.2484, lng: -111.6342, hasDoctors: true },
  { city: 'Raleigh', state: 'NC', slug: 'raleigh-nc', lat: 35.7804, lng: -78.6391, hasDoctors: true },
  { city: 'Redondo Beach', state: 'CA', slug: 'redondo-beach-ca', lat: 33.8398, lng: -118.3846, hasDoctors: true },
  { city: 'Riverside', state: 'CA', slug: 'riverside-ca', lat: 33.9825, lng: -117.3742, hasDoctors: true },
  { city: 'Rocklin', state: 'CA', slug: 'rocklin-ca', lat: 38.7907, lng: -121.2358, hasDoctors: true },
  { city: 'San Diego', state: 'CA', slug: 'san-diego-ca', lat: 32.7157, lng: -117.1638, hasDoctors: true },
  { city: 'Santa Ana', state: 'CA', slug: 'santa-ana-ca', lat: 33.7495, lng: -117.8732, hasDoctors: true },
  { city: 'Sarasota', state: 'FL', slug: 'sarasota-fl', lat: 27.3366, lng: -82.5309, hasDoctors: true },
  { city: 'Savannah', state: 'GA', slug: 'savannah-ga', lat: 32.079, lng: -81.0921, hasDoctors: true },
  { city: 'Seattle', state: 'WA', slug: 'seattle-wa', lat: 47.6038, lng: -122.3301, hasDoctors: true },
  { city: 'Smyrna', state: 'GA', slug: 'smyrna-ga', lat: 33.8839, lng: -84.5147, hasDoctors: true },
  { city: 'Southaven', state: 'MS', slug: 'southaven-ms', lat: 34.9874, lng: -90.0035, hasDoctors: true },
  { city: 'Sparta', state: 'NJ', slug: 'sparta-nj', lat: 41.0402, lng: -74.631, hasDoctors: true },
  { city: 'Spring Branch', state: 'TX', slug: 'spring-branch-tx', lat: 29.8902, lng: -98.4264, hasDoctors: true },
  { city: 'Springfield', state: 'IL', slug: 'springfield-il', lat: 39.799, lng: -89.644, hasDoctors: true },
  { city: 'Starkville', state: 'MS', slug: 'starkville-ms', lat: 33.4639, lng: -88.8152, hasDoctors: true },
  { city: 'Stillwater', state: 'MN', slug: 'stillwater-mn', lat: 45.0559, lng: -92.8076, hasDoctors: true },
  { city: 'Stuart', state: 'FL', slug: 'stuart-fl', lat: 27.198, lng: -80.2519, hasDoctors: true },
  { city: 'Summit', state: 'NJ', slug: 'summit-nj', lat: 40.7182, lng: -74.3592, hasDoctors: true },
  { city: 'Tigard', state: 'OR', slug: 'tigard-or', lat: 45.4307, lng: -122.7719, hasDoctors: true },
  { city: 'Tucson', state: 'AZ', slug: 'tucson-az', lat: 32.2229, lng: -110.9748, hasDoctors: true },
  { city: 'Tulsa', state: 'OK', slug: 'tulsa-ok', lat: 36.1563, lng: -95.9928, hasDoctors: true },
  { city: 'Tupelo', state: 'MS', slug: 'tupelo-ms', lat: 34.2576, lng: -88.7034, hasDoctors: true },
  { city: 'Vancouver', state: 'WA', slug: 'vancouver-wa', lat: 45.6307, lng: -122.6745, hasDoctors: true },
  { city: 'Vineland', state: 'NJ', slug: 'vineland-nj', lat: 39.4863, lng: -75.0254, hasDoctors: true },
  { city: 'Waco', state: 'TX', slug: 'waco-tx', lat: 31.5545, lng: -97.1326, hasDoctors: true },
  { city: 'Waseca', state: 'MN', slug: 'waseca-mn', lat: 44.0172, lng: -93.5886, hasDoctors: true },
  { city: 'Wasilla', state: 'AK', slug: 'wasilla-ak', lat: 61.5824, lng: -149.4426, hasDoctors: true },
  { city: 'Wayne', state: 'PA', slug: 'wayne-pa', lat: 41.6264, lng: -75.3045, hasDoctors: true },
  { city: 'Weatherford', state: 'TX', slug: 'weatherford-tx', lat: 32.759, lng: -97.7971, hasDoctors: true },
  { city: 'Wellington', state: 'FL', slug: 'wellington-fl', lat: 26.655, lng: -80.2375, hasDoctors: true },
  { city: 'West Fargo', state: 'ND', slug: 'west-fargo-nd', lat: 46.875, lng: -96.9004, hasDoctors: true },
  { city: 'West Palm Beach', state: 'FL', slug: 'west-palm-beach-fl', lat: 26.7154, lng: -80.0533, hasDoctors: true },
  { city: 'Woodstock', state: 'GA', slug: 'woodstock-ga', lat: 34.1014, lng: -84.5192, hasDoctors: true },
  { city: 'Yukon', state: 'OK', slug: 'yukon-ok', lat: 35.5067, lng: -97.7625, hasDoctors: true },
];

/** All city pages: doctor cities + empty metros */
export const ALL_CITIES: CityMeta[] = [...DOCTOR_CITIES, ...EMPTY_METROS];

/** Look up city center coordinates by slug. Returns null if not in the lookup. */
export function getCityCoords(slug: string): { lat: number; lng: number } | null {
  const entry = ALL_CITIES.find(c => c.slug === slug);
  return entry ? { lat: entry.lat, lng: entry.lng } : null;
}

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
