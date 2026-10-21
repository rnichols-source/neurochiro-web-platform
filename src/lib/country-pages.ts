/**
 * Country landing page configuration.
 *
 * Adding a new country: add one entry here + create a Stripe price.
 * The route at /[country] and /[country]/welcome auto-resolve from this config.
 */

export interface CountryPageConfig {
  code: string          // ISO 3166-1 alpha-2
  name: string          // "Australia"
  demonym: string       // "Australian"
  currency: string      // "AUD"
  symbol: string        // "A$"
  price: number         // 129
  stripeUrl: string     // payment link URL
  foundingSpots: number // 0 = no founding framing
  spotsRemaining: number // editable between sends
  welcomePath: string   // "/au/welcome"
  source: string        // stored on doctor rows: 'au_founding_2026'
  postcodeLabel: string // "Postcode" | "Postal code" | "ZIP"
  postcodeHint: string  // "2000" | "M5V 3L9" | "SW6 1QR"
}

export const COUNTRY_PAGES: Record<string, CountryPageConfig> = {
  AU: {
    code: 'AU',
    name: 'Australia',
    demonym: 'Australian',
    currency: 'AUD',
    symbol: 'A$',
    price: 129,
    stripeUrl: 'https://buy.stripe.com/cNieVfdfh53SbCK8M47wA10',
    foundingSpots: 15,
    spotsRemaining: 15,
    welcomePath: '/au/welcome',
    source: 'au_founding_2026',
    postcodeLabel: 'Postcode',
    postcodeHint: '2000',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    demonym: 'Canadian',
    currency: 'CAD',
    symbol: 'CA$',
    price: 139,
    stripeUrl: 'https://buy.stripe.com/8x28wR5MP7c04ai9Q87wA11',
    foundingSpots: 25,
    spotsRemaining: 25,
    welcomePath: '/ca/welcome',
    source: 'ca_founding_2026',
    postcodeLabel: 'Postal code',
    postcodeHint: 'M5V 3L9',
  },
  GB: {
    code: 'GB',
    name: 'the UK',
    demonym: 'UK',
    currency: 'GBP',
    symbol: '£',
    price: 79,
    stripeUrl: 'https://buy.stripe.com/14A00ldfh3ZO9uC9Q87wA0Z',
    foundingSpots: 25,
    spotsRemaining: 22,
    welcomePath: '/uk/welcome',
    source: 'uca_birmingham_2026',
    postcodeLabel: 'Postcode',
    postcodeHint: 'SW6 1QR',
  },
}

// Map route slugs to country codes
export const ROUTE_TO_COUNTRY: Record<string, string> = {
  au: 'AU',
  ca: 'CA',
  uk: 'GB',
}

export function getCountryConfig(routeSlug: string): CountryPageConfig | null {
  const code = ROUTE_TO_COUNTRY[routeSlug]
  return code ? COUNTRY_PAGES[code] : null
}

// Membership benefits — verified against actual doctor portal pages
export const MEMBERSHIP_BENEFITS = {
  patients: [
    'Your profile on the directory map',
    'Patients in your area routed to you',
    'Patient leads and contact requests in your portal',
    'Doctor-to-doctor referral network',
  ],
  content: [
    'Your NeuroChiro interview, which becomes your own content',
    'Content library with pre-written social and email templates',
    'Clip captions for your adjustment videos',
    'Featured on the NeuroChiro directory and social accounts',
  ],
  community: [
    'The Weekly Adjustment live show',
    'NeuroChiro Lives',
    'Messaging with every doctor in the network',
    'Job board and ChiroMatch hiring system',
  ],
  tools: [
    'Care plan builder',
    'Scan report interpreter',
    'KPI tracker',
    'P&L analyzer',
    'Billing guide',
    'Contract templates',
    'Workshop and screening kits',
    'CE tracker',
  ],
}
