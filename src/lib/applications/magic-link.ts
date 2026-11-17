const SITE = 'https://neurochiro.co'

/** A full site URL becomes the path. Anything else that is not an apply path falls back. */
export function resumePathOnly(value: string | null | undefined): string {
  const raw = (value || '').trim()
  if (raw.startsWith('/doctor/apply') && !raw.includes('://') && !raw.startsWith('//')) return raw
  try {
    const url = new URL(raw)
    if (url.origin === SITE && url.pathname.startsWith('/doctor/apply')) {
      return `${url.pathname}${url.search}`
    }
  } catch {
    // Not a URL.
  }
  return '/doctor/apply?step=2&resume=1'
}

/** One-time sign-in URL. Supabase magic-link tokens work a single time. Pass a path, not a full URL. */
export function magicResumeUrl(tokenHash: string, nextPath: string): string {
  const next = nextPath.startsWith('/doctor/apply') && !nextPath.includes('://')
    ? nextPath
    : '/doctor/apply?step=2&resume=1'
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: 'magiclink',
    next,
  })
  return `${SITE}/auth/activate?${params.toString()}`
}

/** Recovery link for an existing listing. The token is emailed to the address on file. */
export function listingPasswordUrl(tokenHash: string): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: 'recovery',
    next: '/reset-password',
  })
  return `${SITE}/auth/activate?${params.toString()}`
}
