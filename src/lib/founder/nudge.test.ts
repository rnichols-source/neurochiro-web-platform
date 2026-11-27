import assert from 'node:assert/strict'
import test from 'node:test'
import { doctorsToNudge, nudgeConfirm, nudgeCopy, nudgeLeadsUrl, NUDGE_COOLDOWN_MS } from './nudge.ts'

const NOW = new Date('2026-11-27T15:00:00.000Z')
const LEADS = 'https://neurochiro.co/doctor/leads'

test('a nudge inside 20 hours is skipped and an older one is sent', () => {
  const recentAt = new Date(NOW.getTime() - NUDGE_COOLDOWN_MS + 1_000).toISOString()
  const oldAt = new Date(NOW.getTime() - NUDGE_COOLDOWN_MS - 1_000).toISOString()
  const edge = new Date(NOW.getTime() - NUDGE_COOLDOWN_MS).toISOString()
  const plan = doctorsToNudge(
    ['fresh', 'recent', 'old', 'edge', 'recent'],
    [
      { doctorId: 'recent', at: recentAt },
      { doctorId: 'old', at: oldAt },
      { doctorId: 'edge', at: edge },
      { doctorId: 'stranger', at: recentAt },
    ],
    NOW,
  )
  assert.deepEqual(plan.send, ['fresh', 'old'])
  assert.deepEqual(plan.skipped, ['recent', 'edge'])
})

test('nudge email is one warm note with a leads button', () => {
  const one = nudgeCopy(1, LEADS)
  const many = nudgeCopy(3, LEADS)
  assert.equal(one.subject, 'A patient is waiting to hear from you')
  assert.equal(many.subject, one.subject)
  assert.equal(one.text, '1 patient requested a visit with you on NeuroChiro and is waiting more than 48 hours. A quick reply helps them get in.')
  assert.equal(many.text, '3 patients requested a visit with you on NeuroChiro and are waiting more than 48 hours. A quick reply helps them get in.')
  assert.equal(one.button, 'See the request')
  assert.equal(many.button, 'See the requests')
  assert.match(one.html, /href="https:\/\/neurochiro\.co\/doctor\/leads"/)
  assert.match(many.html, /See the requests/)
  assert.equal(one.html.includes('neurochirodirectory.com'), false)
  assert.equal(one.text.includes('community member'), false)
  assert.equal(/[\u2013\u2014]/.test(`${one.subject} ${one.text} ${one.button} ${many.text}`), false)
  assert.equal(nudgeLeadsUrl(), LEADS)
  assert.equal(nudgeLeadsUrl('https://neurochiro.co/'), LEADS)
})

test('confirm names who will get the reminder and who was nudged recently', () => {
  const text = nudgeConfirm(3, 2)
  assert.match(text, /Send a reminder to 3 doctors\?/)
  assert.match(text, /2 were nudged in the last 20 hours and will be skipped/)
  assert.match(nudgeConfirm(1, 0), /Send a reminder to 1 doctor\?/)
  assert.match(nudgeConfirm(1, 0), /0 were nudged in the last 20 hours and will be skipped/)
  assert.equal(/[\u2013\u2014]/.test(text), false)
})
