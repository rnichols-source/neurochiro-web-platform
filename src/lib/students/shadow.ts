export function canRequestShadow(input: { openCount: number; alreadyOpenWithDoctor: boolean }): { ok: true } | { ok: false; reason: string } {
  if (input.alreadyOpenWithDoctor) return { ok: false, reason: 'You already have an open request with this doctor.' };
  if (input.openCount >= 3) return { ok: false, reason: 'You can have 3 open shadow requests at a time.' };
  return { ok: true };
}
