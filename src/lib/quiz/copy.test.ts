import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cardDistanceText, directoryHref, resultsHeadline } from './copy.ts'

test('local and short headlines use the band and place', () => {
  assert.equal(resultsHeadline({
    count: 3, bandMiles: 25, noLocal: false, closestMiles: null, place: '29601', country: 'US', empty: false,
  }), '3 nervous system chiropractors within 25 miles of 29601')
  assert.equal(resultsHeadline({
    count: 2, bandMiles: 100, noLocal: false, closestMiles: null, place: '29601', country: 'US', empty: false,
  }), '2 nervous system chiropractors within 100 miles of 29601')
})

test('no-local copy names the closest distance and does not call them near', () => {
  const headline = resultsHeadline({
    count: 3, bandMiles: null, noLocal: true, closestMiles: 142, place: '29601', country: 'US', empty: false,
  })
  assert.equal(headline, 'No NeuroChiro doctors within 100 miles of 29601 yet. These are the closest to you, starting 142 miles away.')
  assert.equal(headline.includes('near'), false)
  assert.equal(cardDistanceText(142, 'mi').includes('near'), false)
  assert.equal(cardDistanceText(12, 'mi'), '12 miles away')
})

test('non-US distances are kilometers', () => {
  const headline = resultsHeadline({
    count: 3, bandMiles: 25, noLocal: false, closestMiles: null, place: 'M5V', country: 'CA', empty: false,
  })
  assert.match(headline, /kilometers of M5V/)
  assert.equal(headline.includes('miles'), false)
})

test('an empty country does not invent a fallback list', () => {
  assert.equal(resultsHeadline({
    count: 0, bandMiles: null, noLocal: false, closestMiles: null, place: '29601', country: 'US', empty: true,
  }), "We don't have doctors in the United States yet.")
})

test('directory links keep filters for local results and drop them when nobody is close', () => {
  const local = directoryHref({ place: '29601', country: 'US', concern: 'pain', noLocal: false, empty: false })
  assert.match(local, /location=29601/)
  assert.match(local, /new_patients=1/)
  assert.match(local, /specialties=Sciatica/)
  const far = directoryHref({ place: '99950', country: 'US', concern: 'pain', noLocal: true, empty: false })
  assert.match(far, /location=99950/)
  assert.equal(far.includes('new_patients'), false)
  assert.equal(far.includes('specialties'), false)
})
