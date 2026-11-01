import { randomBytes } from 'node:crypto'

/** Short [a-z0-9] token. Replaces Math.random() so admin code does not use it. */
export function randomToken(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length]
  }
  return out
}
