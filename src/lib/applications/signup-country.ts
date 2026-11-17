import { currencyForCountry, type DoctorCurrency } from './prices.ts'

/** Canadian NANP area codes. A 10-digit number with one of these defaults to Canada. */
export const CANADIAN_AREA_CODES = [
  '204', '226', '236', '249', '250', '257', '263', '289', '306', '343', '354', '365', '367',
  '368', '382', '403', '416', '418', '428', '431', '437', '438', '450', '468', '474', '506',
  '514', '519', '548', '579', '581', '584', '587', '604', '613', '639', '647', '672', '683',
  '705', '709', '742', '753', '778', '780', '782', '807', '819', '825', '867', '873', '879',
  '902', '905',
] as const

const CANADIAN_AREAS = new Set<string>(CANADIAN_AREA_CODES)

function digitsOf(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Country implied by a phone number. Emails and other text are not numbers. */
export function countryFromPhone(raw: string | null | undefined): string | null {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed || /[a-z@]/i.test(trimmed)) return null
  const digits = digitsOf(trimmed)
  const international = trimmed.startsWith('+') || digits.length > 10
  if (international) {
    if (digits.startsWith('1') && digits.length >= 11) {
      return CANADIAN_AREAS.has(digits.slice(1, 4)) ? 'CA' : 'US'
    }
    if (digits.startsWith('61')) return 'AU'
    if (digits.startsWith('64')) return 'NZ'
    if (digits.startsWith('44')) return 'GB'
    if (digits.startsWith('971')) return 'AE'
    if (digits.startsWith('353')) return 'IE'
    if (digits.startsWith('49')) return 'DE'
    if (digits.startsWith('33')) return 'FR'
    if (digits.startsWith('31')) return 'NL'
    if (digits.startsWith('34')) return 'ES'
    if (digits.startsWith('39')) return 'IT'
    if (digits.startsWith('91')) return 'IN'
    return null
  }
  if (digits.length === 10) return CANADIAN_AREAS.has(digits.slice(0, 3)) ? 'CA' : 'US'
  return null
}

/**
 * Signup country. A recognizable phone wins. Otherwise a .ca email is Canada.
 * The person can still change the country on the form.
 */
export function defaultSignupCountry(input: { phone?: string | null; email?: string | null }): string {
  const fromPhone = countryFromPhone(input.phone)
  if (fromPhone) return fromPhone
  const domain = (input.email || '').trim().toLowerCase().split('@')[1] || ''
  if (domain === 'ca' || domain.endsWith('.ca')) return 'CA'
  return 'US'
}

export function currencyForSignup(input: { phone?: string | null; email?: string | null; country?: string | null }): DoctorCurrency {
  const country = (input.country || '').trim().toUpperCase() || defaultSignupCountry(input)
  return currencyForCountry(country)
}
