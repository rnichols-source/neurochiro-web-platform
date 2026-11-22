import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  classifySpam,
  isDottedGmail,
  isHiddenSpamLead,
  isSpamAdminNote,
  looksGibberishToken,
} from './spam.ts'

test('the two Nov 22 appointment bots are quarantined', () => {
  const rfcpz = classifySpam({
    name: 'Rfcpz',
    email: 'core.ya19.02@gmail.com',
    preferredTime: 'eBpIiAKlZMgeRfktGPN',
    message: 'YoSiasSOYrxBgHkDpme',
  })
  assert.equal(rfcpz.quarantine, true, `Rfcpz signals: ${rfcpz.signals.join(',')}`)
  assert.ok(rfcpz.signals.includes('gibberish_name'))
  assert.ok(rfcpz.signals.includes('dotted_gmail'))
  assert.ok(rfcpz.signals.includes('gibberish_preferred_time'))
  assert.ok(rfcpz.signals.includes('gibberish_message'))
  assert.match(rfcpz.adminNote, /^spam\/bot:/)

  const jlvsosd = classifySpam({
    name: 'Jlvsosd',
    email: 'ig.e.p.ani.m.9.5@gmail.com',
    preferredTime: 'gNTXMGejcSxoYJjl',
    message: 'lQlxUOTrlGHzwJZXi',
  })
  assert.equal(jlvsosd.quarantine, true, `Jlvsosd signals: ${jlvsosd.signals.join(',')}`)
  assert.ok(jlvsosd.signals.includes('gibberish_name'))
  assert.ok(jlvsosd.signals.includes('dotted_gmail'))
  assert.ok(jlvsosd.signals.includes('gibberish_preferred_time'))
  assert.ok(jlvsosd.signals.includes('gibberish_message'))
})

test('real recent request names and notes are not quarantined', () => {
  const samples = [
    { name: 'Sherry', email: 'sherrycoleman777@gmail.com', message: 'Anytime on Tuesdays and weekends OR after 4pm on the other weekdays' },
    { name: 'Holly', email: null, message: null },
    { name: 'Stacy', email: null, message: null },
    { name: 'Crystal', email: 'crystalroxy31@gmail.com', message: 'Recommended from another Dr' },
    { name: 'Tamlyn', email: null, message: null },
    { name: 'Madeleine Brown', email: null, message: 'If possible to get an appointment today with Dr. Fruster it would be phenomenal, although I know that may be a difficult ask! If not an afternoon appointment next week would be amazing. Thank you.' },
    { name: 'Domenica DeMola', email: null, message: "We had a baby - she's almost 6 weeks old. She was a forceps baby and has been extra fussy as of late." },
    { name: 'Justin DeMola', email: null, message: 'Hi - Heard from you from instagram thru a referral' },
    { name: 'Carla Leathers', email: 'c.leathers@cox.net', message: 'Wednesday- Friday.' },
    { name: 'Rachel Sabbagh', email: 'rachelsabbagh7@gmail.com', preferredTime: '830-11 am, 12-2 pm', message: "Hi! I'm looking to bring in my daughter" },
    { name: 'Arlene Parlevliet', email: 'maparlevliet@gmail.com', message: 'I got on Dr. Rays neurochiro list from Instagram and he sent me link to your office.' },
    { name: 'Angie winn', email: null, message: null },
    { name: 'aruna raju', email: 'arunablissed@gmail.com', message: null },
    { name: 'Shannon', email: 'sqgrady@yahoo.com', message: null },
    { name: 'Thomas', email: 'thomasftomlojr@gmail.com', message: null },
    { name: 'Kim Blair', email: 'healthy_alts@sbcglobal.net', preferredTime: 'After 2:00 pm daily', message: "I'm interested in a consultation" },
    { name: 'Michelle Fisher', email: null, preferredTime: 'After 2:30pm', message: 'Do you balance the nervous system in adults too?' },
    { name: 'Aaron Haasteaby', email: 'coach.haasteaby@gmail.com', message: 'Dr Raymond Nichols' },
    { name: 'Vanesa', email: 'vanesa.mitrevski@icloud.com', message: 'Any' },
    { name: 'Stephanie', email: 'stephanie@hauptlihaus.com', message: null },
    { name: 'natasha', email: 'natasha@thelongbeachrealtor.com', message: null },
    { name: 'Mahala', email: 'owloveyou30@gmail.com', message: null },
    { name: 'Mary Franklin', email: 'bayexplorer7@gmail.com', message: null },
    { name: 'Nicole', email: 'sclafani.ns@gmail.com', message: null },
    { name: 'TEST', email: 'drmelkrug@inspirelifechirocenter.com', preferredTime: 'never ever', message: 'i need help - do you take insurance?' },
  ]
  for (const sample of samples) {
    const verdict = classifySpam(sample)
    assert.equal(verdict.quarantine, false, `${sample.name} was quarantined: ${verdict.signals.join(',')}`)
  }
})

test('a filled honeypot is always quarantined', () => {
  const verdict = classifySpam({ name: 'Jane Smith', email: 'jane@gmail.com', honeypot: 'http://spam.example' })
  assert.equal(verdict.quarantine, true)
  assert.deepEqual(verdict.signals, ['honeypot'])
})

test('a fast submit alone is not quarantined, but instant plus another signal is', () => {
  const now = 10_000
  const fastOnly = classifySpam({ name: 'Jane Smith', email: 'jane@gmail.com', startedAt: now - 600, now })
  assert.equal(fastOnly.quarantine, false)
  assert.ok(fastOnly.signals.includes('too_fast'))

  const instantPlus = classifySpam({
    name: 'Rfcpz',
    email: 'jane@gmail.com',
    startedAt: now - 200,
    now,
  })
  assert.equal(instantPlus.quarantine, true)
  assert.ok(instantPlus.signals.includes('instant_submit'))
  assert.ok(instantPlus.signals.includes('gibberish_name'))
})

test('ordinary dotted gmail names are not treated as throwaway addresses', () => {
  assert.equal(isDottedGmail('coach.haasteaby@gmail.com'), false)
  assert.equal(isDottedGmail('rachelsabbagh7@gmail.com'), false)
  assert.equal(isDottedGmail('vanesa.mitrevski@icloud.com'), false)
  assert.equal(isDottedGmail('core.ya19.02@gmail.com'), true)
  assert.equal(isDottedGmail('ig.e.p.ani.m.9.5@gmail.com'), true)
})

test('title-case everyday names are not gibberish tokens', () => {
  for (const name of ['Sherry', 'Holly', 'Stacy', 'Crystal', 'Tamlyn', 'Shannon', 'Thomas', 'Nicole']) {
    assert.equal(looksGibberishToken(name), false, name)
  }
  assert.equal(looksGibberishToken('Rfcpz'), true)
  assert.equal(looksGibberishToken('Jlvsosd'), true)
})

test('withdrawn rows closed as spam are hidden from doctor stats, other withdrawals are not', () => {
  assert.equal(isSpamAdminNote('spam/bot (Tor, gibberish), closed per Dr. Ray Nov 22'), true)
  assert.equal(isHiddenSpamLead({ status: 'spam', admin_note: 'spam/bot: honeypot' }), true)
  assert.equal(isHiddenSpamLead({
    status: 'withdrawn',
    admin_note: 'spam/bot (Tor, gibberish), closed per Dr. Ray Nov 22',
  }), true)
  assert.equal(isHiddenSpamLead({ status: 'withdrawn', admin_note: 'Patient asked to withdraw' }), false)
  assert.equal(isHiddenSpamLead({ status: 'new', admin_note: null }), false)
})
