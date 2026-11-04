/**
 * US and Canadian numbers only. Anything else returns null so we never text it.
 * country is accepted for callers; only US and CA are supported on this line.
 */
export function toE164(raw: string | null | undefined, country = 'US'): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const region = country.trim().toUpperCase()
  if (region !== 'US' && region !== 'CA' && region !== 'USA' && region !== 'CANADA') return null

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export function last4(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '')
  return digits.slice(-4)
}
