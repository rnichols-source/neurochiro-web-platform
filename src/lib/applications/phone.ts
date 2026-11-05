import { toE164 } from '../sms/phone.ts'

type Rule = {
  code: string
  national: (nsn: string) => boolean
}

/** Mobile patterns for the countries on the application form. Landlines are rejected. */
const RULES: Record<string, Rule> = {
  AU: { code: '61', national: (n) => /^4\d{8}$/.test(n) },
  GB: { code: '44', national: (n) => /^7\d{9}$/.test(n) },
  NZ: { code: '64', national: (n) => /^2\d{7,9}$/.test(n) },
  AE: { code: '971', national: (n) => /^5\d{8}$/.test(n) },
  IE: { code: '353', national: (n) => /^8\d{8}$/.test(n) },
  DE: { code: '49', national: (n) => /^1[567]\d{8,10}$/.test(n) },
  FR: { code: '33', national: (n) => /^[67]\d{8}$/.test(n) },
  NL: { code: '31', national: (n) => /^6\d{8}$/.test(n) },
  ES: { code: '34', national: (n) => /^[67]\d{8}$/.test(n) },
  IT: { code: '39', national: (n) => /^3\d{8,9}$/.test(n) },
}

function regionOf(country: string): string {
  const region = country.trim().toUpperCase()
  if (region === 'UK') return 'GB'
  if (region === 'USA') return 'US'
  if (region === 'CANADA') return 'CA'
  if (region === 'UAE') return 'AE'
  return region
}

function otherE164(raw: string): string | null {
  const compact = raw.trim().replace(/[\s().-]/g, '')
  if (!compact.startsWith('+') && !compact.startsWith('00')) return null
  let digits = compact.replace(/\D/g, '')
  if (compact.startsWith('00')) digits = digits.replace(/^00/, '')
  if (digits.length < 8 || digits.length > 15) return null
  if (digits[0] === '0') return null
  return `+${digits}`
}

function withCallingCode(raw: string, rule: Rule): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const compact = trimmed.replace(/[\s().-]/g, '')
  const plus = compact.startsWith('+')
  const doubleZero = !plus && compact.startsWith('00')
  let digits = compact.replace(/\D/g, '')
  if (!digits) return null
  if (doubleZero) digits = digits.replace(/^00/, '')

  if (plus || doubleZero) {
    if (!digits.startsWith(rule.code)) return null
  } else if (digits.startsWith('0')) {
    digits = rule.code + digits.replace(/^0+/, '')
  } else if (!(digits.startsWith(rule.code) && rule.national(digits.slice(rule.code.length)))) {
    digits = rule.code + digits
  }

  const national = digits.slice(rule.code.length)
  if (!rule.national(national)) return null
  if (digits.length < 8 || digits.length > 15) return null
  return `+${digits}`
}

/**
 * Normalize an application mobile to E.164 using the country they selected.
 * US and Canada use the same NANP rules as lead texts. Other listed countries
 * accept mobiles only. "Another country" must already include a + country code.
 */
export function toApplicationE164(raw: string | null | undefined, country: string): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const region = regionOf(country)
  if (region === 'US' || region === 'CA') return toE164(trimmed, region)
  if (region === 'OTHER') return otherE164(trimmed)
  const rule = RULES[region]
  if (!rule) return null
  return withCallingCode(trimmed, rule)
}
