// Exchange rates for approximate local currency display on /pro.
// These are display-only approximations. Stripe charges in USD.
// Last updated: 2026-09-29
// Update via /admin/settings or edit this file.

export interface CurrencyInfo {
  symbol: string     // e.g. "CA$", "£", "A$", "NZ$"
  rate: number       // 1 USD = X local currency
  label: string      // e.g. "Canadian dollars", "British pounds"
}

export const CURRENCY_RATES: Record<string, CurrencyInfo> = {
  CA: { symbol: "CA$", rate: 1.36, label: "Canadian dollars" },
  GB: { symbol: "£",   rate: 0.79, label: "British pounds" },
  NZ: { symbol: "NZ$", rate: 1.70, label: "New Zealand dollars" },
  AU: { symbol: "A$",  rate: 1.55, label: "Australian dollars" },
}

// USD prices — single source of truth
export const USD_MONTHLY = 99
export const USD_ANNUAL = 990

export function convertToLocal(usd: number, country: string): string | null {
  const info = CURRENCY_RATES[country]
  if (!info) return null
  const local = Math.round(usd * info.rate)
  return `${info.symbol}${local.toLocaleString()}`
}

export function getConversionLine(country: string): string | null {
  const info = CURRENCY_RATES[country]
  if (!info) return null
  const monthly = convertToLocal(USD_MONTHLY, country)
  return `about ${monthly}/month, billed in US dollars`
}
