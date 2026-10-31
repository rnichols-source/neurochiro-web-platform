const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UuidError extends Error {
  constructor() {
    super('Invalid id');
    this.name = 'UuidError';
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** Rejects anything that is not a UUID, including PostgREST filter fragments. */
export function assertUuid(value: unknown): string {
  if (!isUuid(value)) throw new UuidError();
  return value;
}
