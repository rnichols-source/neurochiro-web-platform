const SITE = 'https://neurochiro.co'

/** One-time sign-in URL. Supabase magic-link tokens work a single time. */
export function magicResumeUrl(tokenHash: string, nextPath: string): string {
  const next = nextPath.startsWith('/doctor/apply') ? nextPath : '/doctor/apply?step=2&resume=1'
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: 'magiclink',
    next,
  })
  return `${SITE}/auth/activate?${params.toString()}`
}
