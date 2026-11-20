import assert from 'node:assert/strict'
import test from 'node:test'
import { doctorCanSeeDoneLine, followCounts, followFlags, type FollowRow } from './follow-through.ts'

const now = new Date('2026-11-18T18:00:00.000Z')
const zone = 'America/New_York'

function row(patch: Partial<FollowRow>): FollowRow {
  return {
    id: '1',
    name: 'Ada',
    plan: 'Neck plan',
    assignmentId: 'a',
    recommendedAt: '2026-11-01T15:00:00.000Z',
    openedAt: null,
    lastTickAt: null,
    ...patch,
  }
}

test('follow-through counts recommended, opened, this week, and slipping', () => {
  const rows = [
    row({ id: 'new', recommendedAt: '2026-11-17T15:00:00.000Z' }),
    row({ id: 'open', openedAt: '2026-11-02T15:00:00.000Z' }),
    row({ id: 'week', lastTickAt: '2026-11-18T15:00:00.000Z', openedAt: '2026-11-02T15:00:00.000Z' }),
    row({ id: 'slip', lastTickAt: '2026-11-01T15:00:00.000Z', openedAt: '2026-11-01T15:00:00.000Z' }),
  ]
  const counts = followCounts(rows, now, zone)
  assert.equal(counts.recommended, 4)
  assert.equal(counts.opened, 3)
  assert.equal(counts.following, 1)
  assert.equal(counts.slipping, 2)
  assert.equal(followFlags(rows[0], now, zone).slipping, false)
})

test('the patient line names the doctor', () => {
  assert.equal(doctorCanSeeDoneLine('Dr. Ada Lovelace'), 'Dr. Ada Lovelace can see which exercises you mark done.')
  assert.equal(doctorCanSeeDoneLine('Dr.'), 'Your doctor can see which exercises you mark done.')
})
