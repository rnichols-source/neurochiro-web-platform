/** Patient-directory country helpers. Shared by the search API and the country chip. */

export const EUROPEAN_ISO = [
  "GB", "IE", "FR", "DE", "ES", "IT", "NL", "BE", "PT", "AT", "CH", "SE", "NO", "DK", "FI",
  "PL", "CZ", "GR", "HU", "RO", "BG", "HR", "SK", "SI", "LT", "LV", "EE", "LU", "MT", "CY", "IS",
];

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
]);

const CA_PROVINCES = new Set(["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "PE", "NL"]);
const AU_STATES = new Set(["NSW", "VIC", "QLD", "SA", "TAS", "ACT", "NT"]);

const CITY_COUNTRY: Record<string, string> = {
  london: "GB",
  manchester: "GB",
  birmingham: "GB",
  toronto: "CA",
  vancouver: "CA",
  montreal: "CA",
  calgary: "CA",
  ottawa: "CA",
  sydney: "AU",
  melbourne: "AU",
  brisbane: "AU",
  auckland: "NZ",
  wellington: "NZ",
  berlin: "DE",
  paris: "FR",
  amsterdam: "NL",
  dublin: "IE",
  rome: "IT",
  madrid: "ES",
  munich: "DE",
};

/** ISO country implied by a typed place, or null when it does not look foreign or local. */
export function countryHint(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact) || /^[A-Z]\d[A-Z]$/.test(compact)) return "CA";
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) return "GB";
  const tokens = raw.split(/[,\s]+/).filter(Boolean);
  const tail = (tokens[tokens.length - 1] || "").toUpperCase();
  if (CA_PROVINCES.has(tail)) return "CA";
  if (AU_STATES.has(tail)) return "AU";
  if (US_STATES.has(tail)) return "US";
  const city = raw.split(",")[0].trim().toLowerCase();
  return CITY_COUNTRY[city] || null;
}

/** Map an ISO country onto a directory country chip: US, CA, UK, AU, NZ, EU, or the ISO code. */
export function toDirectoryCountry(iso: string): string {
  const code = iso.toUpperCase();
  if (code === "GB") return "UK";
  if (code === "UK" || code === "US" || code === "CA" || code === "AU" || code === "NZ" || code === "EU" || code === "ALL") {
    return code;
  }
  if (EUROPEAN_ISO.includes(code)) return "EU";
  return code;
}

export function isoForDirectoryCountry(code: string): string {
  if (code === "UK") return "GB";
  return code;
}

const FLAGS: Record<string, { label: string; flag: string }> = {
  US: { label: "United States", flag: "🇺🇸" },
  CA: { label: "Canada", flag: "🇨🇦" },
  UK: { label: "United Kingdom", flag: "🇬🇧" },
  GB: { label: "United Kingdom", flag: "🇬🇧" },
  AU: { label: "Australia", flag: "🇦🇺" },
  NZ: { label: "New Zealand", flag: "🇳🇿" },
  EU: { label: "Europe", flag: "🇪🇺" },
  ALL: { label: "Global", flag: "🌍" },
  DE: { label: "Germany", flag: "🇩🇪" },
  FR: { label: "France", flag: "🇫🇷" },
  IE: { label: "Ireland", flag: "🇮🇪" },
  NL: { label: "Netherlands", flag: "🇳🇱" },
  IT: { label: "Italy", flag: "🇮🇹" },
  ES: { label: "Spain", flag: "🇪🇸" },
};

export function countryMeta(code: string): { label: string; flag: string } {
  return FLAGS[code] || { label: code, flag: "📍" };
}
