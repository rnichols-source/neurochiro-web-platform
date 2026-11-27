import { FOUNDING_END } from './format.ts'
import { FOUNDING_RATE_ENDS_AT, foundingRateOpen } from '../member-referrals/logic.ts'
import { doctorCheckoutPrice } from '../portal/checkout-price.ts'

export type BroadcastDraft = {
  id: 'founding' | 'stalled'
  audience: 'founding' | 'stalled'
  subject: string
  body: string
}

const JOIN_URL = 'https://neurochiro.co/get-started'
const APPLY_URL = 'https://neurochiro.co/doctor/apply'

/** December 1, 2026 at midnight Eastern, same instant as the Pulse countdown. */
export function foundingDeadline(): Date {
  return new Date(FOUNDING_RATE_ENDS_AT)
}

export function broadcastDraft(id: string, now = new Date()): BroadcastDraft | null {
  if (id === 'founding') return foundingHeadsUp(now)
  if (id === 'stalled') return stalledReminder()
  return null
}

export function foundingHeadsUp(now = new Date()): BroadcastDraft {
  const after = doctorCheckoutPrice(new Date(foundingDeadline().getTime() + 1000))
  const open = foundingRateOpen(now) && now.getTime() < FOUNDING_END.getTime()
  const later = `After December 1, new memberships are ${after.monthlyWithUnit} or ${after.annualWithUnit}.`
  const reward = 'If a doctor you introduce is approved and pays, your next month is free, or your paid year is extended by a month.'
  const body = open
    ? [
        'I wanted you to hear this from me.',
        'The founding rate is still open through December 1. Anyone who joins before then, or a doctor you refer before then, comes in at that rate. Your rate does not change.',
        later,
        reward,
        JOIN_URL,
      ].join('\n\n')
    : [
        'I wanted you to hear this from me.',
        'The founding rate closed on December 1. Your rate does not change.',
        later,
        reward,
        JOIN_URL,
      ].join('\n\n')
  return {
    id: 'founding',
    audience: 'founding',
    subject: 'The founding rate ends December 1',
    body,
  }
}

/** Group note for doctors who started an application and did not pay. Same facts as the application reminder, with no personal name and no sign-off. */
export function stalledReminder(): BroadcastDraft {
  return {
    id: 'stalled',
    audience: 'stalled',
    subject: 'Your NeuroChiro application is still open',
    body: [
      'You started your NeuroChiro application, and it is still unfinished.',
      'It takes about 5 minutes. You will save a card at the end, and your card is not charged unless you are approved.',
      APPLY_URL,
    ].join('\n\n'),
  }
}
