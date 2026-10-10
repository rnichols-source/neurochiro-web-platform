/**
 * Central country configuration.
 * Sorted by demand request count (countries with demand first),
 * then alphabetically for the rest.
 *
 * This is the single source of truth for all country dropdowns,
 * search filters, and form validation across the platform.
 */

export interface CountryConfig {
  name: string
  iso2: string
  flag: string
  regionLabel: string // "State", "Province", "County", etc.
  postalLabel: string // "ZIP Code", "Postal Code", "Postcode", etc.
  postalPattern?: string // regex pattern for validation, undefined = accept any
  hasDemand: boolean
  demandCount: number
  mapView?: { center: [number, number]; zoom: number }
}

// Countries with demand, sorted by request count
const DEMAND_COUNTRIES: CountryConfig[] = [
  { name: 'United States', iso2: 'US', flag: '🇺🇸', regionLabel: 'State', postalLabel: 'ZIP Code', postalPattern: '^\\d{5}(-\\d{4})?$', hasDemand: true, demandCount: 1845, mapView: { center: [-96, 38], zoom: 3.8 } },
  { name: 'United Kingdom', iso2: 'GB', flag: '🇬🇧', regionLabel: 'Region', postalLabel: 'Postcode', hasDemand: true, demandCount: 100, mapView: { center: [-2, 54], zoom: 5.2 } },
  { name: 'Canada', iso2: 'CA', flag: '🇨🇦', regionLabel: 'Province', postalLabel: 'Postal Code', postalPattern: '^[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d$', hasDemand: true, demandCount: 90, mapView: { center: [-96, 56], zoom: 3.2 } },
  { name: 'Australia', iso2: 'AU', flag: '🇦🇺', regionLabel: 'State', postalLabel: 'Postcode', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 40, mapView: { center: [134, -25], zoom: 3.5 } },
  { name: 'South Africa', iso2: 'ZA', flag: '🇿🇦', regionLabel: 'Province', postalLabel: 'Postal Code', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 15 },
  { name: 'United Arab Emirates', iso2: 'AE', flag: '🇦🇪', regionLabel: 'Emirate', postalLabel: 'Postal Code', hasDemand: true, demandCount: 11 },
  { name: 'Nigeria', iso2: 'NG', flag: '🇳🇬', regionLabel: 'State', postalLabel: 'Postal Code', hasDemand: true, demandCount: 9 },
  { name: 'India', iso2: 'IN', flag: '🇮🇳', regionLabel: 'State', postalLabel: 'PIN Code', postalPattern: '^\\d{6}$', hasDemand: true, demandCount: 5 },
  { name: 'Germany', iso2: 'DE', flag: '🇩🇪', regionLabel: 'State', postalLabel: 'Postal Code', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 4 },
  { name: 'Japan', iso2: 'JP', flag: '🇯🇵', regionLabel: 'Prefecture', postalLabel: 'Postal Code', postalPattern: '^\\d{3}-?\\d{4}$', hasDemand: true, demandCount: 3 },
  { name: 'Mexico', iso2: 'MX', flag: '🇲🇽', regionLabel: 'State', postalLabel: 'Postal Code', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 3 },
  { name: 'Denmark', iso2: 'DK', flag: '🇩🇰', regionLabel: 'Region', postalLabel: 'Postal Code', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 2 },
  { name: 'France', iso2: 'FR', flag: '🇫🇷', regionLabel: 'Region', postalLabel: 'Code Postal', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 2 },
  { name: 'Kenya', iso2: 'KE', flag: '🇰🇪', regionLabel: 'County', postalLabel: 'Postal Code', hasDemand: true, demandCount: 2 },
  { name: 'Portugal', iso2: 'PT', flag: '🇵🇹', regionLabel: 'District', postalLabel: 'Postal Code', hasDemand: true, demandCount: 2 },
  { name: 'Sweden', iso2: 'SE', flag: '🇸🇪', regionLabel: 'County', postalLabel: 'Postal Code', postalPattern: '^\\d{3}\\s?\\d{2}$', hasDemand: true, demandCount: 2 },
  { name: 'Switzerland', iso2: 'CH', flag: '🇨🇭', regionLabel: 'Canton', postalLabel: 'Postal Code', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 2 },
  { name: 'Trinidad and Tobago', iso2: 'TT', flag: '🇹🇹', regionLabel: 'Region', postalLabel: 'Postal Code', hasDemand: true, demandCount: 2 },
  { name: 'Bulgaria', iso2: 'BG', flag: '🇧🇬', regionLabel: 'Province', postalLabel: 'Postal Code', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 1 },
  { name: 'Chile', iso2: 'CL', flag: '🇨🇱', regionLabel: 'Region', postalLabel: 'Postal Code', hasDemand: true, demandCount: 1 },
  { name: 'Croatia', iso2: 'HR', flag: '🇭🇷', regionLabel: 'County', postalLabel: 'Postal Code', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 1 },
  { name: 'Morocco', iso2: 'MA', flag: '🇲🇦', regionLabel: 'Region', postalLabel: 'Postal Code', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 1 },
  { name: 'New Zealand', iso2: 'NZ', flag: '🇳🇿', regionLabel: 'Region', postalLabel: 'Postcode', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 1, mapView: { center: [174, -41], zoom: 5 } },
  { name: 'North Macedonia', iso2: 'MK', flag: '🇲🇰', regionLabel: 'Region', postalLabel: 'Postal Code', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 1 },
  { name: 'Pakistan', iso2: 'PK', flag: '🇵🇰', regionLabel: 'Province', postalLabel: 'Postal Code', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 1 },
  { name: 'Philippines', iso2: 'PH', flag: '🇵🇭', regionLabel: 'Province', postalLabel: 'ZIP Code', postalPattern: '^\\d{4}$', hasDemand: true, demandCount: 1 },
  { name: 'Saudi Arabia', iso2: 'SA', flag: '🇸🇦', regionLabel: 'Province', postalLabel: 'Postal Code', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 1 },
  { name: 'Singapore', iso2: 'SG', flag: '🇸🇬', regionLabel: 'Region', postalLabel: 'Postal Code', postalPattern: '^\\d{6}$', hasDemand: true, demandCount: 1 },
  { name: 'Türkiye', iso2: 'TR', flag: '🇹🇷', regionLabel: 'Province', postalLabel: 'Postal Code', postalPattern: '^\\d{5}$', hasDemand: true, demandCount: 1 },
  { name: 'Zambia', iso2: 'ZM', flag: '🇿🇲', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: true, demandCount: 1 },
  { name: 'Zimbabwe', iso2: 'ZW', flag: '🇿🇼', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: true, demandCount: 1 },
]

// Common additional countries (no demand yet but likely to have doctors or patients)
const OTHER_COUNTRIES: CountryConfig[] = [
  { name: 'Argentina', iso2: 'AR', flag: '🇦🇷', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Austria', iso2: 'AT', flag: '🇦🇹', regionLabel: 'State', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Belgium', iso2: 'BE', flag: '🇧🇪', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Brazil', iso2: 'BR', flag: '🇧🇷', regionLabel: 'State', postalLabel: 'CEP', hasDemand: false, demandCount: 0 },
  { name: 'China', iso2: 'CN', flag: '🇨🇳', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Colombia', iso2: 'CO', flag: '🇨🇴', regionLabel: 'Department', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Egypt', iso2: 'EG', flag: '🇪🇬', regionLabel: 'Governorate', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Finland', iso2: 'FI', flag: '🇫🇮', regionLabel: 'Region', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Ghana', iso2: 'GH', flag: '🇬🇭', regionLabel: 'Region', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Greece', iso2: 'GR', flag: '🇬🇷', regionLabel: 'Region', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Iceland', iso2: 'IS', flag: '🇮🇸', regionLabel: 'Region', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Indonesia', iso2: 'ID', flag: '🇮🇩', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Ireland', iso2: 'IE', flag: '🇮🇪', regionLabel: 'County', postalLabel: 'Eircode', hasDemand: false, demandCount: 0 },
  { name: 'Israel', iso2: 'IL', flag: '🇮🇱', regionLabel: 'District', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Italy', iso2: 'IT', flag: '🇮🇹', regionLabel: 'Region', postalLabel: 'CAP', hasDemand: false, demandCount: 0 },
  { name: 'Malaysia', iso2: 'MY', flag: '🇲🇾', regionLabel: 'State', postalLabel: 'Postcode', hasDemand: false, demandCount: 0 },
  { name: 'Netherlands', iso2: 'NL', flag: '🇳🇱', regionLabel: 'Province', postalLabel: 'Postcode', hasDemand: false, demandCount: 0 },
  { name: 'Norway', iso2: 'NO', flag: '🇳🇴', regionLabel: 'County', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Peru', iso2: 'PE', flag: '🇵🇪', regionLabel: 'Region', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Poland', iso2: 'PL', flag: '🇵🇱', regionLabel: 'Voivodeship', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Romania', iso2: 'RO', flag: '🇷🇴', regionLabel: 'County', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'South Korea', iso2: 'KR', flag: '🇰🇷', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Spain', iso2: 'ES', flag: '🇪🇸', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Taiwan', iso2: 'TW', flag: '🇹🇼', regionLabel: 'County', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Thailand', iso2: 'TH', flag: '🇹🇭', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
  { name: 'Vietnam', iso2: 'VN', flag: '🇻🇳', regionLabel: 'Province', postalLabel: 'Postal Code', hasDemand: false, demandCount: 0 },
]

export const ALL_COUNTRIES: CountryConfig[] = [...DEMAND_COUNTRIES, ...OTHER_COUNTRIES]

export function getCountryByIso2(iso2: string): CountryConfig | undefined {
  return ALL_COUNTRIES.find(c => c.iso2 === iso2)
}

export function getCountriesWithDemand(): CountryConfig[] {
  return DEMAND_COUNTRIES
}

export function getCountryDropdownOptions(): { value: string; label: string; flag: string }[] {
  return ALL_COUNTRIES.map(c => ({
    value: c.iso2,
    label: c.name,
    flag: c.flag,
  }))
}
