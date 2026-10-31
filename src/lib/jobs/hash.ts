import { createHash } from 'node:crypto';

export function viewerHash(input: { userId?: string | null; ip?: string | null; ua?: string | null }): string {
  const material = input.userId
    ? `user:${input.userId}`
    : `anon:${input.ip || 'unknown'}|${input.ua || ''}`;
  return createHash('sha256').update(material).digest('hex');
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
