import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { backfillWithin25, instagramDm, matchIgWaiters, musePaste, parseIgPaste, parseLocation } from './dm.ts'

describe('instagram waitlist import and Muse copy', () => {
  it('reads handle, location, and date, and skips a header', () => {
    const parsed = parseIgPaste('handle,location,date\n@Ada.Spine,"Greenville, SC",2026-10-02\nbad row')
    assert.equal(parsed.rows.length, 1)
    assert.equal(parsed.rows[0].handle, 'ada.spine')
    assert.equal(parsed.rows[0].location, 'Greenville, SC')
    assert.equal(parsed.rows[0].requestedAt?.slice(0, 10), '2026-10-02')
    assert.equal(parsed.errors.length, 1)
    assert.deepEqual(parseLocation('Greenville, SC 29601'), { city: 'Greenville', state: 'SC', zip: '29601', country: 'US' })
  })

  it('matches 25 miles before 50 and skips someone already told about that doctor', () => {
    const waiters = [
      waiter('far', 34.9, -82.4),
      waiter('near', 34.85, -82.4),
      waiter('done', 34.85, -82.4, ['doc-1']),
    ]
    const matches = matchIgWaiters(waiters, { id: 'doc-1', latitude: 34.8526, longitude: -82.394 }, 50)
    assert.equal(matches.some((row) => row.id === 'done'), false)
    assert.equal(matches[0].band <= matches[matches.length - 1].band, true)
    assert.ok(matches.some((row) => row.band === 25))
  })

  it('writes a short DM and a Muse paste with the request link', () => {
    const message = instagramDm({
      name: 'Ada',
      handle: 'ada.spine',
      doctorName: 'Dr. Lovelace',
      doctorCity: 'Greenville',
      profileUrl: 'https://neurochiro.co/directory/ada-lovelace',
    })
    assert.match(message, /Dr\. Ray/)
    assert.match(message, /https:\/\/neurochiro\.co\/contact-request\?doctor=ada-lovelace/)
    assert.equal(message.toLowerCase().includes('patient'), false)
    const paste = musePaste([{ handle: '@ada.spine', message }])
    assert.match(paste, /^@ada\.spine\nHey Ada/)
  })

  it('lists people who already have a live doctor within 25 miles', () => {
    const rows = backfillWithin25(
      [waiter('near', 34.85, -82.4)],
      [{ id: 'doc-1', latitude: 34.8526, longitude: -82.394 }],
    )
    assert.equal(rows.length, 1)
    assert.equal(rows[0].doctorId, 'doc-1')
  })
})

function waiter(id: string, latitude: number, longitude: number, notified: string[] = []) {
  return {
    id,
    handle: id,
    name: id,
    city: 'Greenville',
    state: 'SC',
    latitude,
    longitude,
    notifiedDoctorIds: notified,
  }
}
