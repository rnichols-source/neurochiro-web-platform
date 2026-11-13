import assert from 'node:assert/strict'
import test from 'node:test'
import { barPercent, daysUntil, FOUNDING_END, median, parseVisitPrice } from './format.ts'
import { doctorHealth } from './health-score.ts'

const now = new Date('2026-11-13T12:00:00.000Z')

test('health score drops for a quiet doctor with a waiting request', () => {
  const result = doctorHealth({
    waiting48: 2,
    requests: 4,
    replied: 1,
    lastSignIn: '2026-10-01T00:00:00.000Z',
    hasPhoto: false,
    now,
  })
  assert.equal(result.score, 100 - 25 - 15 - 20 - 10)
  assert.equal(result.tone, 'risk')
  assert.equal(result.reasons[0], '2 requests waiting 48h+')
})

test('health score stays high when the doctor is current', () => {
  const result = doctorHealth({
    waiting48: 0,
    requests: 3,
    replied: 3,
    lastSignIn: '2026-11-12T00:00:00.000Z',
    hasPhoto: true,
    now,
  })
  assert.equal(result.score, 100)
  assert.equal(result.tone, 'ok')
})

test('founding countdown and visit price parsing', () => {
  assert.equal(daysUntil(now, FOUNDING_END), 18)
  assert.equal(daysUntil(new Date('2026-12-02T12:00:00.000Z'), FOUNDING_END), 0)
  assert.equal(median([10, 30, 20]), 20)
  assert.equal(median([4, 8]), 6)
  assert.equal(parseVisitPrice('$140 first visit'), 140)
  assert.equal(parseVisitPrice('2019'), null)
  assert.ok(barPercent(94, 5052) < barPercent(5052, 5052))
})
