import assert from 'node:assert/strict'
import test from 'node:test'
import {
  annualizeMembershipUsd,
  formatRoiMultiple,
  parseMoneyInput,
  parsePatientsStarted,
  parseReportedOn,
  roiMultiple,
  sumRevenue,
  todayInNewYork,
} from './patient-starts-calc.ts'

test('parses care-plan amounts and rejects junk', () => {
  assert.equal(parseMoneyInput('$2,134'), 2134)
  assert.equal(parseMoneyInput('2134.12'), 2134.12)
  assert.equal(parseMoneyInput(''), null)
  assert.equal(parseMoneyInput('-10'), null)
  assert.equal(parseMoneyInput('abc'), null)
})

test('parses patients started as a non-negative integer', () => {
  assert.equal(parsePatientsStarted('4'), 4)
  assert.equal(parsePatientsStarted('0'), 0)
  assert.equal(parsePatientsStarted('1.5'), null)
  assert.equal(parsePatientsStarted('-1'), null)
})

test('parses a calendar date and rejects invalid days', () => {
  assert.equal(parseReportedOn('2026-11-13'), '2026-11-13')
  assert.equal(parseReportedOn('2026-11-31'), null)
  assert.equal(parseReportedOn('11/13/2026'), null)
})

test('today in New York is YYYY-MM-DD', () => {
  assert.equal(todayInNewYork(new Date('2026-11-13T20:30:00Z')), '2026-11-13')
  assert.equal(todayInNewYork(new Date('2026-11-14T03:30:00Z')), '2026-11-13')
})

test('annualizes a monthly USD membership and leaves unknown intervals alone', () => {
  assert.equal(annualizeMembershipUsd({ unitAmount: 9900, interval: 'month', currency: 'usd' }), 1188)
  assert.equal(annualizeMembershipUsd({ unitAmount: 99900, interval: 'year', currency: 'usd' }), 999)
  assert.equal(annualizeMembershipUsd({ unitAmount: 0, interval: 'month', currency: 'usd' }), null)
  assert.equal(annualizeMembershipUsd({ unitAmount: 9900, interval: 'forever', currency: 'usd' }), null)
})

test('ROI and network sums stay null when a value is missing', () => {
  assert.equal(roiMultiple(25608, 1188), 21.56)
  assert.equal(formatRoiMultiple(21.56), '21.6×')
  assert.equal(formatRoiMultiple(4), '4×')
  assert.equal(sumRevenue([8536, 6402, 4268, 4268, 2134]), 25608)
  assert.equal(sumRevenue([8536, null]), null)
})
