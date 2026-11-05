/**
 * Dialing codes for the patient waitlist phone field.
 * Storage uses E.164. Sending still goes through the US/Canada SMS helper,
 * which declines numbers the US Quo line cannot text.
 */

import { toE164 } from './sms/phone.ts'
import { normalizeCountryHint } from './detect-postal.ts'

const CALLING: Record<string, string> = {
  US: '1', CA: '1', GB: '44', IE: '353', AU: '61', NZ: '64', IN: '91', AE: '971',
  ZA: '27', NG: '234', DE: '49', JP: '81', MX: '52', DK: '45', FR: '33', KE: '254',
  PT: '351', SE: '46', CH: '41', TT: '1868', BG: '359', CL: '56', HR: '385', MA: '212',
  MK: '389', PK: '92', PH: '63', SA: '966', SG: '65', TR: '90', ZM: '260', ZW: '263',
  AR: '54', AT: '43', BE: '32', BR: '55', CN: '86', CO: '57', EG: '20', FI: '358',
  GH: '233', GR: '30', IS: '354', ID: '62', IL: '972', IT: '39', MY: '60', NL: '31',
  NO: '47', PE: '51', PL: '48', RO: '40', KR: '82', ES: '34', TW: '886', TH: '66', VN: '84',
  RS: '381', BW: '267', BO: '591', LB: '961', JM: '1876',
}

export function callingCode(country: string): string {
  return CALLING[normalizeCountryHint(country)] || '1'
}

/**
 * National number plus the selected country's dialing code, or a number
 * the person already typed with a plus. Returns null when it cannot be
 * a real E.164 number. US and Canada use the shared NANP checker.
 */
export function toInternationalE164(raw: string | null | undefined, country: string): string | null {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return null
  const region = normalizeCountryHint(country)

  if (region === 'US' || region === 'CA') return toE164(trimmed, region)

  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '')
    if (digits.length < 8 || digits.length > 15) return null
    if (digits.startsWith('0')) return null
    return `+${digits}`
  }

  let digits = trimmed.replace(/\D/g, '').replace(/^0+/, '')
  const cc = callingCode(region)
  if (digits.startsWith(cc) && digits.length - cc.length >= 6) digits = digits.slice(cc.length)
  if (digits.length < 6 || digits.length > 12) return null
  const full = `${cc}${digits}`
  if (full.length < 8 || full.length > 15) return null
  return `+${full}`
}
