import { canTextNumber } from '../go-live/plan.ts'

const STOP_WORDS = new Set(['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'])

export function isStopMessage(body: string | null | undefined): boolean {
  const word = (body || '').trim().toLowerCase().replace(/[.!]+$/g, '')
  return STOP_WORDS.has(word)
}

export type WaitlistTextGate =
  | 'send'
  | 'no_phone'
  | 'no_consent'
  | 'opted_out'
  | 'not_textable'
  | 'already_sent'

/** Text only with a US/Canada number, recorded consent, and no prior text for this doctor. */
export function waitlistTextGate(input: {
  phone: string | null
  consent: boolean
  optedOut: boolean
  alreadySent: boolean
}): WaitlistTextGate {
  if (input.optedOut) return 'opted_out'
  if (!input.consent) return 'no_consent'
  if (!input.phone) return 'no_phone'
  if (!canTextNumber(input.phone)) return 'not_textable'
  if (input.alreadySent) return 'already_sent'
  return 'send'
}
