/**
 * Centralized founder check. Uses FOUNDER_EMAILS env var (comma-separated).
 * Falls back to empty list if not set — no one gets founder access by default.
 */
const founderEmails = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return founderEmails.includes(email.toLowerCase())
}
