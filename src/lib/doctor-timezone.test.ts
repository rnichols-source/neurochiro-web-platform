import assert from 'node:assert/strict'
import { test } from 'node:test'
import { explainDoctorTimezone, getDoctorTimezone } from './doctor-timezone.ts'

test('US state codes map to a timezone', () => {
  assert.equal(getDoctorTimezone('SC', 'US'), 'America/New_York')
  assert.equal(getDoctorTimezone('ca', 'US'), 'America/Los_Angeles')
  assert.equal(getDoctorTimezone('TX', 'United States'), 'America/Chicago')
})

test('full US state names map, including mixed case', () => {
  assert.equal(getDoctorTimezone('South Carolina', 'United States'), 'America/New_York')
  assert.equal(getDoctorTimezone('  south carolina  ', 'usa'), 'America/New_York')
  assert.equal(getDoctorTimezone('California', null), 'America/Los_Angeles')
})

test('Canadian province names and codes map', () => {
  assert.equal(getDoctorTimezone('British Columbia', 'Canada'), 'America/Vancouver')
  assert.equal(getDoctorTimezone('ON', 'CA'), 'America/Toronto')
  assert.equal(getDoctorTimezone('Newfoundland and Labrador', 'Canada'), 'America/St_Johns')
})

test('unknown state falls back instead of returning null when a fallback is given', () => {
  assert.equal(getDoctorTimezone('ZZ', 'US'), null)
  assert.equal(getDoctorTimezone('Not A State', 'United States', 'America/New_York'), 'America/New_York')
  const explained = explainDoctorTimezone('Atlantis', 'US', 'America/Chicago')
  assert.equal(explained.timezone, 'America/Chicago')
  assert.equal(explained.usedFallback, true)
})

test('a known state is not marked as a fallback', () => {
  const explained = explainDoctorTimezone('South Carolina', 'United States', 'America/Chicago')
  assert.equal(explained.timezone, 'America/New_York')
  assert.equal(explained.usedFallback, false)
})
