/**
 * Signup welcome routing.
 *
 * Community members are stored as role `patient` and still get the community
 * welcome. Doctors, including applicants created by the membership checkout
 * ingest, do not. Their welcome is the approval email sent from
 * /admin/applications.
 *
 * The checkout ingest sets `app_metadata.role = doctor` and leaves
 * `user_metadata.role` empty. The auth.users trigger must use the same
 * resolution as `resolvedSignupRole` or it will queue this welcome as a
 * community member.
 */

export function isDoctorSignupRole(role: string | null | undefined): boolean {
  return (role || '').trim().toLowerCase().includes('doctor')
}

/** Role stored on the new profile and used to decide whether to queue a welcome. */
export function resolvedSignupRole(input: {
  userMetadataRole?: string | null
  appMetadataRole?: string | null
}): string {
  const appRole = (input.appMetadataRole || '').trim().toLowerCase()
  if (appRole.includes('doctor')) return appRole
  const userRole = (input.userMetadataRole || '').trim().toLowerCase()
  if (userRole) return userRole
  return 'patient'
}

export function shouldQueueSignupWelcome(role: string | null | undefined): boolean {
  return !isDoctorSignupRole(role)
}

export type SignupWelcomeKind = 'community' | 'student' | 'vendor' | 'generic' | 'skip'

/**
 * `accountRole` is the profile role or the auth app/user metadata role.
 * A queue row can still say `patient` when the account is a doctor, because
 * the trigger used to default a missing user-metadata role to patient.
 */
export function signupWelcomeKind(input: {
  queuedRole?: string | null
  accountRole?: string | null
}): SignupWelcomeKind {
  if (isDoctorSignupRole(input.queuedRole) || isDoctorSignupRole(input.accountRole)) return 'skip'
  const role = (input.queuedRole || '').trim().toLowerCase()
  if (role === 'student') return 'student'
  if (role === 'vendor') return 'vendor'
  if (role === 'patient') return 'community'
  return 'generic'
}
