const SITE = 'https://neurochiro.co'

/** Same-site relative path only. Rejects protocol-relative and off-site URLs. */
export function safeReturnPath(input: string | null | undefined): string | null {
  if (input == null) return null
  const value = input.trim()
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (value.includes('\\')) return null
  if (value.includes('://')) return null
  if (/[\u0000-\u001F\u007F]/.test(value)) return null

  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return null
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  if (decoded.includes('\\') || decoded.includes('://')) return null
  if (/[\u0000-\u001F\u007F]/.test(decoded)) return null

  let url: URL
  try {
    url = new URL(value, SITE)
  } catch {
    return null
  }
  if (url.origin !== SITE) return null
  if (url.username || url.password) return null
  const path = `${url.pathname}${url.search}${url.hash}`
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (path.includes('\\') || path.includes('://')) return null
  return path
}

/** Login URL that returns to a same-site path. Falls back to the application. */
export function loginPathWithReturn(returnPath: string | null | undefined): string {
  const next = safeReturnPath(returnPath) || '/doctor/apply'
  return `/login?next=${encodeURIComponent(next)}`
}
