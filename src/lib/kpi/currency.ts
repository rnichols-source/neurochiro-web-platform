/**
 * Currency for the KPI scorecard, matched to the clinic country.
 * The P&L analyzer uses the same country list on its own branch. This copy
 * stays here so the scorecard does not depend on that file.
 */

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  US: 'USD', USA: 'USD', 'UNITED STATES': 'USD', 'UNITED STATES OF AMERICA': 'USD',
  CA: 'CAD', CANADA: 'CAD',
  GB: 'GBP', UK: 'GBP', 'UNITED KINGDOM': 'GBP', 'GREAT BRITAIN': 'GBP', ENGLAND: 'GBP',
  SCOTLAND: 'GBP', WALES: 'GBP', 'NORTHERN IRELAND': 'GBP',
  AU: 'AUD', AUSTRALIA: 'AUD',
  NZ: 'NZD', 'NEW ZEALAND': 'NZD',
  IE: 'EUR', IRELAND: 'EUR',
  DE: 'EUR', GERMANY: 'EUR',
  FR: 'EUR', FRANCE: 'EUR',
  ES: 'EUR', SPAIN: 'EUR',
  IT: 'EUR', ITALY: 'EUR',
  NL: 'EUR', NETHERLANDS: 'EUR', 'THE NETHERLANDS': 'EUR',
  BE: 'EUR', BELGIUM: 'EUR',
  AT: 'EUR', AUSTRIA: 'EUR',
  PT: 'EUR', PORTUGAL: 'EUR',
  FI: 'EUR', FINLAND: 'EUR',
  GR: 'EUR', GREECE: 'EUR',
  LU: 'EUR', LUXEMBOURG: 'EUR',
  EE: 'EUR', ESTONIA: 'EUR',
  LV: 'EUR', LATVIA: 'EUR',
  LT: 'EUR', LITHUANIA: 'EUR',
  SK: 'EUR', SLOVAKIA: 'EUR',
  SI: 'EUR', SLOVENIA: 'EUR',
  MT: 'EUR', MALTA: 'EUR',
  CY: 'EUR', CYPRUS: 'EUR',
  HR: 'EUR', CROATIA: 'EUR',
  EU: 'EUR', EUROPE: 'EUR',
  AE: 'AED', UAE: 'AED', 'UNITED ARAB EMIRATES': 'AED',
  IN: 'INR', INDIA: 'INR',
}

export function currencyForCountry(country: string | null | undefined): string {
  if (!country) return 'USD'
  const key = country.trim().replace(/\./g, '').replace(/\s+/g, ' ').toUpperCase()
  return CURRENCY_BY_COUNTRY[key] || 'USD'
}

export function formatMoney(amount: number, currency = 'USD'): string {
  const negative = amount < 0
  const abs = Math.abs(amount)
  const digits = Number.isInteger(abs) ? 0 : 2
  try {
    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(abs)
    return negative ? `-${formatted}` : formatted
  } catch {
    const sign = negative ? '-' : ''
    return `${sign}${currency} ${abs.toFixed(digits)}`
  }
}

export function currencySymbol(currency = 'USD'): string {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).formatToParts(0)
    return parts.find((part) => part.type === 'currency')?.value || currency
  } catch {
    return currency
  }
}
