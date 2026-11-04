/** Referral links must use a question mark. `/get-started&ref=` drops the code. */
export function joinRoleHref(role: 'doctor' | 'student', code: string): string {
  const params = new URLSearchParams()
  if (role === 'student') params.set('role', 'student')
  const trimmed = code.trim()
  if (trimmed) params.set('ref', trimmed)
  const query = params.toString()
  return query ? `/get-started?${query}` : '/get-started'
}
