import { createHmac, timingSafeEqual, createHash } from 'node:crypto';

export const OUTCOME_KEYS = ['talked', 'shadow_booked', 'shadow_done', 'interviewed', 'offer', 'hired', 'not_a_fit', 'no_reply'] as const;
export type OutcomeKey = (typeof OUTCOME_KEYS)[number];

export type OutcomePayload = {
  matchId: string;
  userId: string;
  outcome: OutcomeKey;
  exp: number;
};

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function signOutcomeToken(payload: OutcomePayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function readOutcomeToken(token: string, secret: string, nowSec: number): { ok: true; payload: OutcomePayload } | { ok: false; reason: 'bad' | 'expired' } {
  const [body, mac] = token.split('.');
  if (!body || !mac || !secret) return { ok: false, reason: 'bad' };
  const expected = sign(body, secret);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return { ok: false, reason: 'bad' };
  let payload: OutcomePayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as OutcomePayload;
  } catch {
    return { ok: false, reason: 'bad' };
  }
  if (!payload || typeof payload.exp !== 'number' || !OUTCOME_KEYS.includes(payload.outcome)) return { ok: false, reason: 'bad' };
  if (!payload.matchId || !payload.userId) return { ok: false, reason: 'bad' };
  if (payload.exp < nowSec) return { ok: false, reason: 'expired' };
  return { ok: true, payload };
}

export function consumeOutcomeToken(used: Set<string>, token: string, secret: string, nowSec: number): { ok: true; payload: OutcomePayload } | { ok: false; reason: 'bad' | 'expired' | 'used' } {
  const read = readOutcomeToken(token, secret, nowSec);
  if (!read.ok) return read;
  const hash = tokenHash(token);
  if (used.has(hash)) return { ok: false, reason: 'used' };
  used.add(hash);
  return read;
}
