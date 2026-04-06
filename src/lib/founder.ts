/**
 * Checks if the given role (from the database profiles.role column) has founder/admin privileges.
 * This is the primary way to check for elevated access — always use this over email checks.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false
  return ['founder', 'admin', 'super_admin', 'regional_admin'].includes(role)
}

export function isFounderRole(role: string | null | undefined): boolean {
  if (!role) return false
  return role === 'founder'
}

/**
 * Bootstrap check using env var. ONLY used during login to set the initial role
 * for founder accounts. All other code should use isAdminRole/isFounderRole
 * which check the database role.
 */
const founderEmails = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return founderEmails.includes(email.toLowerCase())
}
