const STAFF_ROLES = new Set(['admin', 'super_admin', 'founder', 'regional_admin'])

function normalized(role: string | null | undefined): string {
  return (role ?? '').trim()
}

/** Patient or a blank role may become doctor only when that user already has a doctors row. */
export function canAutoCorrectToDoctor(
  currentRole: string | null | undefined,
  hasDoctorRow: boolean,
): boolean {
  if (!hasDoctorRow) return false
  const role = normalized(currentRole)
  if (STAFF_ROLES.has(role)) return false
  return role === '' || role === 'patient'
}

/** A doctor, student, or patient may become a vendor after they submit a vendor application. */
export function canTransitionToVendor(currentRole: string | null | undefined): boolean {
  const role = normalized(currentRole)
  if (STAFF_ROLES.has(role)) return false
  return role === 'doctor' || role === 'student' || role === 'patient'
}

/** Only a student account may switch to doctor. */
export function canTransitionStudentToDoctor(currentRole: string | null | undefined): boolean {
  const role = normalized(currentRole)
  if (STAFF_ROLES.has(role)) return false
  return role === 'student' || role === 'student_paid'
}
