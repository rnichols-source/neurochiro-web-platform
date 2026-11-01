import { createHash, timingSafeEqual } from 'node:crypto'

export const VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000

export const EXPIRED_LINK_MESSAGE = 'This link expired — send a new one'

export function hashVerificationToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

/**
 * Compare a stored sha256 hex digest to the hash of the raw token from the email.
 * A stored raw token does not match, so leaked raw values stop working.
 */
export function verificationTokensMatch(storedHash: string | null | undefined, rawToken: string | null | undefined): boolean {
  if (!storedHash || !rawToken) return false
  const incoming = hashVerificationToken(rawToken)
  const left = Buffer.from(storedHash, 'utf8')
  const right = Buffer.from(incoming, 'utf8')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function verificationExpiryIso(now = Date.now()): string {
  return new Date(now + VERIFICATION_TTL_MS).toISOString()
}

/** A missing expiry (column not migrated yet) is not treated as expired. A bad timestamp is. */
export function isVerificationExpired(expiresAt: string | null | undefined, now = Date.now()): boolean {
  if (!expiresAt) return false
  const parsed = Date.parse(expiresAt)
  if (Number.isNaN(parsed)) return true
  return parsed <= now
}

export function consumeVerificationToken<T extends { verification_token?: string | null }>(row: T): T {
  return { ...row, verification_token: null }
}
