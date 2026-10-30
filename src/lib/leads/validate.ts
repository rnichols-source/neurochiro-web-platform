export const HEALTH_WORD_RE = /diagnos|symptom|condition|medication|treatment|surgery|pain level|mri|x-ray|prescription/i

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isPlausibleEmail(value: string | null | undefined): boolean {
  if (!value) return false
  return EMAIL_RE.test(value.trim())
}

/** At least 7 digits in the main number. Extensions (x, ext, extension) are allowed. */
export function isPlausiblePhone(value: string | null | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  const main = trimmed.replace(/\s*(?:extension|ext\.?|x)\s*[\d.]+\s*$/i, '')
  const digits = main.replace(/\D/g, '')
  return digits.length >= 7
}

export function containsHealthWords(value: string | null | undefined): boolean {
  if (!value) return false
  return HEALTH_WORD_RE.test(value)
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null
  const email = value.trim().toLowerCase()
  return isPlausibleEmail(email) ? email : null
}

export function sourceLabel(source: string | null | undefined): string {
  if (source === 'dm_outreach') return 'from a NeuroChiro Instagram introduction'
  if (source === 'appointment' || source === 'profile') return 'from your NeuroChiro profile'
  if (source === 'doctor_joined') return 'from a NeuroChiro introduction'
  return 'from NeuroChiro'
}

export function telHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}

/** Pull email and best-time out of legacy note strings. Does not invent a message. */
export function parseLegacyNote(note: string | null | undefined): { email: string; preferredTime: string } {
  if (!note) return { email: '', preferredTime: '' }
  const emailMatch = note.match(/email:\s*([^\s,;]+@[^\s,;]+)/i)
  const timeMatch = note.match(/best time to reach you:\s*([^.]*)/i)
  return {
    email: normalizeEmail(emailMatch?.[1] || '') || '',
    preferredTime: timeMatch?.[1]?.trim() || '',
  }
}
