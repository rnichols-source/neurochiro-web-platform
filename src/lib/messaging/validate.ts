export const MAX_MESSAGE_LENGTH = 2000;

const CONTROL_EXCEPT_NEWLINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export type BodyResult =
  | { ok: true; body: string }
  | { ok: false; code: string; userMessage: string };

export function validateBody(raw: string): BodyResult {
  const stripped = String(raw ?? '').replace(CONTROL_EXCEPT_NEWLINE, '');
  const body = stripped.trim();
  if (!body || body.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, code: body.length > MAX_MESSAGE_LENGTH ? 'too_long' : 'empty', userMessage: `Message must be 1-${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (body.startsWith('[SYSTEM]')) {
    return { ok: false, code: 'system_prefix', userMessage: 'That message cannot be sent.' };
  }
  return { ok: true, body };
}
