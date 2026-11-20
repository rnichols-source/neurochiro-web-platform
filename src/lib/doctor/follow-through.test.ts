import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FOLLOW_BOARD,
  boardStatus,
  defaultTimesPerWeek,
  doctorCanSeeDoneLine,
  followCounts,
  followLabelForPerson,
  recommendDelivery,
  sortFollowRows,
  type FollowRow,
} from './follow-through.ts'

const now = new Date('2026-11-18T18:00:00.000Z')
const zone = 'America/New_York'

function days(start: string, count: number): string[] {
  const [year, month, day] = start.split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index))
    return date.toISOString().slice(0, 10)
  })
}

function row(patch: Partial<FollowRow>): FollowRow {
  return {
    id: '1',
    name: 'Ada',
    plan: 'Neck plan',
    assignmentId: 'a',
    recommendedAt: '2026-11-06T15:00:00.000Z',
    openedAt: '2026-11-06T16:00:00.000Z',
    lastTickAt: null,
    timesPerWeek: 7,
    doneOn: [],
    ...patch,
  }
}

test('plan frequency snaps to daily, 3 times a week, or once a week', () => {
  assert.equal(defaultTimesPerWeek('Daily (6x/week)'), 7)
  assert.equal(defaultTimesPerWeek('3x/week'), 3)
  assert.equal(defaultTimesPerWeek('1x/week'), 1)
  assert.equal(FOLLOW_BOARD.greenMin, 0.75)
  assert.equal(FOLLOW_BOARD.yellowMin, 0.4)
})

function onTrackDays(): string[] {
  return [...days('2026-11-06', 8), '2026-11-18']
}

test('nine of twelve daily sessions is on track', () => {
  const status = boardStatus(row({ doneOn: onTrackDays() }), now, zone)
  assert.equal(status.sinceExpected, 12)
  assert.equal(status.sinceDone, 9)
  assert.equal(status.tone, 'green')
  assert.equal(status.label, 'On track')
})

test('falling behind, stopped, and never opened use the shared thresholds', () => {
  const behind = boardStatus(row({ doneOn: [...days('2026-11-06', 5), '2026-11-18'] }), now, zone)
  assert.equal(behind.sinceDone, 6)
  assert.equal(behind.tone, 'yellow')
  assert.equal(behind.label, 'Falling behind')

  const stopped = boardStatus(row({ doneOn: days('2026-11-15', 4) }), now, zone)
  assert.equal(stopped.tone, 'red')
  assert.equal(stopped.label, 'Stopped')

  const unread = boardStatus(row({
    recommendedAt: '2026-11-15T15:00:00.000Z',
    openedAt: null,
    timesPerWeek: 1,
    doneOn: [],
  }), now, zone)
  assert.equal(unread.sinceExpected, 0)
  assert.equal(unread.tone, 'red')
})

test('a quiet stretch turns an otherwise green plan yellow, then red', () => {
  const yellow = boardStatus(row({
    recommendedAt: '2026-11-01T15:00:00.000Z',
    doneOn: days('2026-11-01', 14),
    lastTickAt: '2026-11-14T15:00:00.000Z',
  }), now, zone)
  assert.equal(yellow.tone, 'yellow')

  const red = boardStatus(row({
    recommendedAt: '2026-11-01T15:00:00.000Z',
    doneOn: days('2026-11-01', 11),
    lastTickAt: '2026-11-11T15:00:00.000Z',
  }), now, zone)
  assert.equal(red.tone, 'red')
})

test('the board sorts stopped, then falling behind, then on track', () => {
  const rows = [
    row({ id: 'green', name: 'Maya', doneOn: onTrackDays() }),
    row({ id: 'red', name: 'Luis', doneOn: days('2026-11-15', 2) }),
    row({ id: 'yellow', name: 'Sam', doneOn: [...days('2026-11-06', 5), '2026-11-18'] }),
  ]
  const counts = followCounts(rows, now, zone)
  assert.equal(counts.all, 3)
  assert.equal(counts.onTrack, 1)
  assert.equal(counts.falling, 1)
  assert.equal(counts.stopped, 1)
  assert.deepEqual(sortFollowRows(rows, now, zone).map((item) => item.id), ['red', 'yellow', 'green'])
})

test('a home plan or remedy goes to the account or the email they already shared', () => {
  assert.deepEqual(recommendDelivery({ profileId: 'p1', email: null, kind: 'library' }), { ok: true, channel: 'assign' })
  assert.deepEqual(recommendDelivery({ profileId: null, email: 'ada@example.com', kind: 'library' }), { ok: true, channel: 'invite' })
  assert.deepEqual(recommendDelivery({ profileId: null, email: 'ada@example.com', kind: 'remedy' }), { ok: true, channel: 'invite' })
  assert.deepEqual(recommendDelivery({ profileId: null, email: 'ada@example.com', kind: 'new' }), { ok: true, channel: 'email_steps' })
  const missing = recommendDelivery({ profileId: null, email: '', kind: 'library' })
  assert.equal(missing.ok, false)
})

test('the patient card shows the worst follow-through line', () => {
  const rows = [
    row({ id: 'ada', name: 'Ada', profileId: 'p1', email: 'ada@example.com', doneOn: onTrackDays() }),
  ]
  assert.equal(followLabelForPerson({ profileId: 'p1', email: null }, rows, now, zone), 'On track, 9 of 12')
  assert.equal(followLabelForPerson({ profileId: null, email: 'ADA@example.com' }, rows, now, zone), 'On track, 9 of 12')
  assert.equal(followLabelForPerson({ profileId: 'other', email: 'nope@example.com' }, rows, now, zone), null)
})

test('the patient line names the doctor', () => {
  assert.equal(doctorCanSeeDoneLine('Dr. Ada Lovelace'), 'Dr. Ada Lovelace can see which exercises you mark done.')
  assert.equal(doctorCanSeeDoneLine('Dr.'), 'Your doctor can see which exercises you mark done.')
})
