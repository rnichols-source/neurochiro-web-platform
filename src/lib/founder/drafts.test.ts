import assert from 'node:assert/strict'
import test from 'node:test'
import { FOUNDING_END } from './format.ts'
import { broadcastDraft, foundingDeadline, foundingHeadsUp, stalledReminder } from './drafts.ts'
import { doctorCheckoutPrice } from '../portal/checkout-price.ts'

const DASH = /[\u2013\u2014]/
const BEFORE = new Date(foundingDeadline().getTime() - 1000)

test('the Pulse countdown and the referral deadline are the same instant', () => {
  assert.equal(foundingDeadline().toISOString(), FOUNDING_END.toISOString())
})

test('the founding draft is ready to review and does not send itself', () => {
  const draft = foundingHeadsUp(BEFORE)
  const price = doctorCheckoutPrice(new Date(foundingDeadline().getTime() + 1000))
  assert.equal(draft.audience, 'founding')
  assert.equal(draft.subject, 'The founding rate ends December 1')
  assert.match(draft.body, /I wanted you to hear this from me/)
  assert.match(draft.body, /still open through December 1/)
  assert.match(draft.body, /doctor you refer before then/)
  assert.match(draft.body, /Your rate does not change/)
  assert.match(draft.body, new RegExp(price.monthlyWithUnit.replace(/[$.]/g, '\\$&')))
  assert.match(draft.body, new RegExp(price.annualWithUnit.replace(/[$.]/g, '\\$&')))
  assert.match(draft.body, /https:\/\/neurochiro\.co\/get-started/)
  assert.equal(draft.body.includes('Perfect Storm'), false)
  assert.equal(draft.body.includes('Dr. Ray'), false)
  assert.equal(DASH.test(`${draft.subject}\n${draft.body}`), false)
  assert.equal(broadcastDraft('founding', BEFORE)?.subject, draft.subject)
  assert.equal(broadcastDraft('nope'), null)
})

test('the stalled reminder reuses the application facts without a sign-off', () => {
  const draft = stalledReminder()
  assert.equal(draft.audience, 'stalled')
  assert.equal(draft.subject, 'Your NeuroChiro application is still open')
  assert.match(draft.body, /still unfinished/)
  assert.match(draft.body, /about 5 minutes/)
  assert.match(draft.body, /not charged unless you are approved/)
  assert.match(draft.body, /https:\/\/neurochiro\.co\/doctor\/apply/)
  assert.equal(draft.body.includes('Dr. Ray'), false)
  assert.equal(DASH.test(`${draft.subject}\n${draft.body}`), false)
  assert.equal(broadcastDraft('stalled')?.body, draft.body)
})
