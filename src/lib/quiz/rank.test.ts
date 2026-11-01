import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rankMatches, type RankAnswers, type RankDoctor } from './rank.ts'

const answers: RankAnswers = { concern: 'pain', country: 'US', priority: 'closest' }

function doc(overrides: Partial<RankDoctor> & { id: string }): RankDoctor {
  return {
    slug: `dr-${overrides.id}`,
    first_name: 'Amy',
    last_name: 'Adams',
    verification_status: 'verified',
    country: 'US',
    accepting_new_patients: null,
    accepts_walkins: false,
    distance_miles: 5,
    specialties: [],
    ...overrides,
  }
}

test('demo slugs and null slugs are dropped', () => {
  const ranked = rankMatches([
    doc({ id: 'demo', slug: 'office-demo', distance_miles: 1 }),
    doc({ id: 'blank', slug: null, distance_miles: 1 }),
    doc({ id: 'ok', distance_miles: 4 }),
  ], answers)
  assert.deepEqual(ranked.matches.map((row) => row.id), ['ok'])
})

test('blank accepting is kept and ranks below true', () => {
  const ranked = rankMatches([
    doc({ id: 'blank', accepting_new_patients: null, distance_miles: 8, last_name: 'Baker' }),
    doc({ id: 'open', accepting_new_patients: true, distance_miles: 8, last_name: 'Carter' }),
    doc({ id: 'third', distance_miles: 9, last_name: 'Dunn' }),
  ], answers)
  assert.equal(ranked.matches[0].id, 'open')
  assert.equal(ranked.matches[1].id, 'blank')
  assert.equal(ranked.noLocal, false)
})

test('explicit false accepting is dropped', () => {
  const ranked = rankMatches([
    doc({ id: 'closed', accepting_new_patients: false, distance_miles: 1 }),
    doc({ id: 'open', distance_miles: 12 }),
    doc({ id: 'second', distance_miles: 14 }),
    doc({ id: 'third', distance_miles: 16 }),
  ], answers)
  assert.equal(ranked.matches.some((row) => row.id === 'closed'), false)
})

test('a local doctor with low views still appears when six others are farther', () => {
  const doctors = [
    doc({ id: 'close', distance_miles: 1, profile_views: 0, last_name: 'Young' }),
    ...[2, 3, 4, 5, 6, 7].map((miles) => doc({
      id: `far-${miles}`,
      distance_miles: miles,
      profile_views: 1000,
      last_name: `Far${miles}`,
    })),
  ]
  const ranked = rankMatches(doctors, answers)
  assert.equal(ranked.matches[0].id, 'close')
  assert.equal(ranked.matches.length, 6)
  assert.equal(ranked.matches.some((row) => row.id === 'far-7'), false)
  assert.equal(ranked.band, 10)
})

test('band selection uses the smallest band with 3 doctors', () => {
  const ten = rankMatches([
    doc({ id: 'a', distance_miles: 3 }),
    doc({ id: 'b', distance_miles: 6 }),
    doc({ id: 'c', distance_miles: 9 }),
  ], answers)
  assert.equal(ten.band, 10)

  const twentyFive = rankMatches([
    doc({ id: 'a', distance_miles: 8 }),
    doc({ id: 'b', distance_miles: 9 }),
    doc({ id: 'c', distance_miles: 22 }),
  ], answers)
  assert.equal(twentyFive.band, 25)

  const hundred = rankMatches([
    doc({ id: 'a', distance_miles: 40 }),
    doc({ id: 'b', distance_miles: 45 }),
    doc({ id: 'c', distance_miles: 80 }),
  ], answers)
  assert.equal(hundred.band, 100)

  const few = rankMatches([
    doc({ id: 'a', distance_miles: 30 }),
    doc({ id: 'b', distance_miles: 90 }),
  ], answers)
  assert.equal(few.band, 100)
  assert.equal(few.noLocal, false)
  assert.equal(few.matches.length, 2)
})

test('noLocal reports the closest miles', () => {
  const ranked = rankMatches([
    doc({ id: 'far', distance_miles: 142, last_name: 'Miles' }),
    doc({ id: 'farther', distance_miles: 200, last_name: 'Zed' }),
  ], answers)
  assert.equal(ranked.noLocal, true)
  assert.equal(ranked.closestMiles, 142)
  assert.equal(ranked.band, null)
  assert.equal(ranked.matches[0].id, 'far')
})

test('country filter keeps a null US country and drops other countries', () => {
  const ranked = rankMatches([
    doc({ id: 'legacy', country: null, distance_miles: 4 }),
    doc({ id: 'ca', country: 'CA', distance_miles: 2 }),
    doc({ id: 'us', country: 'US', distance_miles: 6 }),
    doc({ id: 'third', distance_miles: 8 }),
  ], answers)
  assert.deepEqual(ranked.matches.map((row) => row.id).sort(), ['legacy', 'third', 'us'])

  const uk = rankMatches([
    doc({ id: 'gb', country: 'GB', distance_miles: 3, slug: 'dr-gb' }),
    doc({ id: 'uk', country: 'UK', distance_miles: 4, slug: 'dr-uk' }),
    doc({ id: 'us', country: 'US', distance_miles: 1, slug: 'dr-us' }),
    doc({ id: 'extra', country: 'GB', distance_miles: 5, slug: 'dr-extra' }),
  ], { ...answers, country: 'UK' })
  assert.equal(uk.matches.some((row) => row.id === 'us'), false)
  assert.equal(uk.matches.some((row) => row.id === 'gb'), true)
})

test('each priority orders the band differently', () => {
  const near = doc({ id: 'near', distance_miles: 5, specialties: ['Wellness'], accepting_new_patients: null, accepts_walkins: false, last_name: 'Near' })
  const fit = doc({ id: 'fit', distance_miles: 20, specialties: ['Sciatica', 'Migraines'], accepting_new_patients: null, accepts_walkins: false, last_name: 'Fit' })
  const open = doc({ id: 'open', distance_miles: 18, specialties: [], accepting_new_patients: true, accepts_walkins: false, last_name: 'Open' })
  const walk = doc({ id: 'walk', distance_miles: 16, specialties: [], accepting_new_patients: null, accepts_walkins: true, last_name: 'Walk' })
  const filler = doc({ id: 'filler', distance_miles: 9, last_name: 'Filler' })
  const rows = [near, fit, open, walk, filler]

  assert.equal(rankMatches(rows, { ...answers, priority: 'closest' }).matches[0].id, 'near')
  assert.equal(rankMatches(rows, { ...answers, priority: 'specialty' }).matches[0].id, 'fit')
  assert.equal(rankMatches(rows, { ...answers, priority: 'new_patients' }).matches[0].id, 'open')
  assert.equal(rankMatches(rows, { ...answers, priority: 'walk_in' }).matches[0].id, 'walk')
})

test('concern specialty fit prefers a matching specialty', () => {
  const ranked = rankMatches([
    doc({ id: 'well', specialties: ['Wellness retreat'], distance_miles: 6, last_name: 'Well' }),
    doc({ id: 'pain', specialties: ['Sciatica care'], distance_miles: 12, last_name: 'Pain' }),
    doc({ id: 'third', distance_miles: 14, last_name: 'Third' }),
  ], { ...answers, priority: 'specialty' })
  assert.equal(ranked.matches[0].id, 'pain')
  assert.ok(ranked.matches[0].fit >= 1)
})

test('pending doctors are excluded', () => {
  const ranked = rankMatches([
    doc({ id: 'pending', verification_status: 'pending', distance_miles: 1 }),
    doc({ id: 'a', distance_miles: 2 }),
    doc({ id: 'b', distance_miles: 3 }),
    doc({ id: 'c', distance_miles: 4 }),
  ], answers)
  assert.equal(ranked.matches.some((row) => row.id === 'pending'), false)
})
