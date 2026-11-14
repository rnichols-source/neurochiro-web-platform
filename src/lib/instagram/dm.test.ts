import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { haversineDistance } from '../geo.ts'
import {
  backfillWithin25,
  instagramComment,
  instagramDm,
  listingInstagramHandle,
  matchClosestIgWaiters,
  matchIgWaiters,
  musePaste,
  parseIgPaste,
  parseLocation,
  type IgWaiter,
} from './dm.ts'

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
    assert.match(message, /https:\/\/neurochiro\.co\/directory\/ada-lovelace#appointment-form/)
    assert.equal(message.includes('contact-request'), false)
    assert.equal(message.toLowerCase().includes('patient'), false)
    const paste = musePaste([{ handle: '@ada.spine', message }])
    assert.match(paste, /^@ada\.spine\nHey Ada/)
  })

  it('keeps people inside 60 miles when the new doctor is the closest', () => {
    const doctor = { id: 'doc-new', latitude: 34.85, longitude: -82.39 }
    const inside = shiftNorth(doctor, 55)
    const outside = shiftNorth(doctor, 70)
    assert.ok(haversineDistance(doctor.latitude, doctor.longitude, inside.latitude, inside.longitude) <= 60)
    assert.ok(haversineDistance(doctor.latitude, doctor.longitude, outside.latitude, outside.longitude) > 60)
    const matches = matchClosestIgWaiters(
      [waiter('inside', inside.latitude, inside.longitude), waiter('outside', outside.latitude, outside.longitude)],
      doctor,
      [doctor],
    )
    assert.deepEqual(matches.map((row) => row.id), ['inside'])
    assert.ok(matches[0].miles <= 60)
  })

  it('skips someone who already has a closer live doctor', () => {
    const doctor = { id: 'doc-new', latitude: 34.85, longitude: -82.39 }
    const person = shiftNorth(doctor, 40)
    const closer = { id: 'doc-old', latitude: person.latitude, longitude: person.longitude }
    const matches = matchClosestIgWaiters(
      [waiter('person', person.latitude, person.longitude)],
      doctor,
      [doctor, closer],
    )
    assert.equal(matches.length, 0)
  })

  it('includes someone previously sent a doctor more than 30 miles away, and skips a nearer previous send', () => {
    const doctor = { id: 'doc-new', latitude: 34.85, longitude: -82.39 }
    const person = shiftNorth(doctor, 20)
    const farLive = shiftNorth(doctor, 100)
    const base = waiter('person', person.latitude, person.longitude)
    const again = matchClosestIgWaiters(
      [{ ...base, lastDoctorSentId: 'doc-old', lastDoctorSentMiles: 45 }],
      doctor,
      [doctor, { id: 'doc-far', ...farLive }],
    )
    assert.equal(again.length, 1)
    const kept = matchClosestIgWaiters(
      [{ ...base, lastDoctorSentId: 'doc-old', lastDoctorSentMiles: 12 }],
      doctor,
      [doctor, { id: 'doc-far', ...farLive }],
    )
    assert.equal(kept.length, 0)
  })

  it('builds a comment and a DM for a person with no handle', () => {
    const doctor = { id: 'doc-new', latitude: 34.85, longitude: -82.39 }
    const person = shiftNorth(doctor, 8)
    const row = waiter('no-handle', person.latitude, person.longitude)
    row.handle = ''
    row.name = 'Ada Lopez'
    row.displayName = 'Ada Lopez'
    row.commentUrl = 'https://www.instagram.com/p/original-comment/'
    row.dmThreadUrl = 'thread:123'
    const matches = matchClosestIgWaiters([row], doctor, [doctor])
    assert.equal(matches.length, 1)
    assert.equal(matches[0].handle, '')
    const comment = instagramComment({
      name: row.name,
      handle: row.handle,
      doctorName: 'Dr. Lovelace',
      doctorHandle: 'dr.lovelace',
      doctorCity: 'Greenville',
      profileUrl: 'ada-lovelace',
      variantKey: row.id,
    })
    const message = instagramDm({
      name: row.name,
      handle: row.handle,
      doctorName: 'Dr. Lovelace',
      doctorCity: 'Greenville',
      profileUrl: 'https://neurochiro.co/directory/ada-lovelace',
    })
    assert.match(comment, /Ada Lopez/)
    assert.match(comment, /@dr\.lovelace/)
    assert.match(comment, /https:\/\/neurochiro\.co\/directory\/ada-lovelace#appointment-form/)
    assert.match(message, /https:\/\/neurochiro\.co\/directory\/ada-lovelace#appointment-form/)
    assert.equal(comment.toLowerCase().includes('patient'), false)
    const paste = musePaste([{
      handle: '',
      displayName: 'Ada Lopez',
      comment,
      commentUrl: row.commentUrl,
      dmUrl: row.dmThreadUrl,
      message,
    }])
    assert.equal(paste.startsWith('@'), false)
    assert.match(paste, /^Ada Lopez\nComment: https:\/\/www\.instagram\.com\/p\/original-comment\//)
    assert.match(paste, /DM thread: thread:123/)
    assert.match(paste, /COMMENT\n/)
    assert.match(paste, /\nDM\n/)
    const tagged = instagramComment({
      name: 'Sam',
      handle: 'sam.spine',
      doctorName: 'Dr. Lovelace',
      doctorHandle: 'dr.lovelace',
      doctorCity: 'Greenville',
      profileUrl: 'ada-lovelace',
      variantKey: 'sam',
    })
    assert.match(tagged, /@sam\.spine/)
    assert.match(tagged, /@dr\.lovelace/)
    const variants = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((key) => instagramComment({
      name: 'Sam',
      handle: 'sam.spine',
      doctorName: 'Dr. Lovelace',
      doctorHandle: 'dr.lovelace',
      doctorCity: 'Greenville',
      profileUrl: 'ada-lovelace',
      variantKey: key,
    }))
    assert.ok(new Set(variants).size > 1)
    assert.equal(listingInstagramHandle('https://www.instagram.com/dr.lovelace/', null), 'dr.lovelace')
    assert.equal(listingInstagramHandle('https://www.instagram.com/p/abc/', 'clinic.handle'), 'clinic.handle')
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

function waiter(id: string, latitude: number, longitude: number, notified: string[] = []): IgWaiter {
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

function shiftNorth(origin: { latitude: number; longitude: number }, miles: number) {
  return { latitude: origin.latitude + (miles / 69), longitude: origin.longitude }
}
