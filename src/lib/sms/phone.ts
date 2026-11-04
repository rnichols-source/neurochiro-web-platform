/**
 * US and Canadian numbers only. Anything else returns null so we never text it.
 * country is accepted for callers; only US and CA are supported on this line.
 */
export function toE164(raw: string | null | undefined, country = 'US'): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  if (trimmed.startsWith('+') && !trimmed.startsWith('+1')) return null
  const region = country.trim().toUpperCase()
  if (region !== 'US' && region !== 'CA' && region !== 'USA' && region !== 'CANADA') return null

  const digits = trimmed.replace(/\D/g, '')
  let national: string | null = null
  if (digits.length === 10) national = digits
  else if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1)
  if (!national) return null
  // NANP: area code and exchange cannot start with 0 or 1.
  if (national[0] < '2' || national[0] > '9') return null
  if (national[3] < '2' || national[3] > '9') return null
  return `+1${national}`
}

export function last4(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '')
  return digits.slice(-4)
}
