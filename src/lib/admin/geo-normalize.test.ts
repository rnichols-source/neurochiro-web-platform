import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeCountry, normalizeState } from './geo-normalize.ts'

test('US country aliases collapse and empty stays empty', () => {
  assert.equal(normalizeCountry('US'), 'US')
  assert.equal(normalizeCountry('USA'), 'US')
  assert.equal(normalizeCountry('United States'), 'US')
  assert.equal(normalizeCountry('United States of America'), 'US')
  assert.equal(normalizeCountry(' united states '), 'US')
  assert.equal(normalizeCountry(''), '')
  assert.equal(normalizeCountry(null), '')
  assert.equal(normalizeCountry('   '), '')
  assert.equal(normalizeCountry('Canada'), 'CA')
  assert.equal(normalizeCountry('UK'), 'GB')
  assert.equal(normalizeCountry('Australia'), 'AU')
  assert.equal(normalizeCountry('Narnia'), 'NARNIA')
})

test('Texas and tx become TX', () => {
  assert.equal(normalizeState('Texas'), 'TX')
  assert.equal(normalizeState('tx'), 'TX')
  assert.equal(normalizeState('TX'), 'TX')
  assert.equal(normalizeState(''), '')
  assert.equal(normalizeState(null), '')
  assert.equal(normalizeState('Ontario'), 'ON')
  assert.equal(normalizeState('British Columbia'), 'BC')
  assert.equal(normalizeState('Québec'), 'QC')
  assert.equal(normalizeState('NSW'), 'NSW')
  assert.equal(normalizeState('England'), 'ENG')
  assert.equal(normalizeState('Nottinghamshire'), 'NOTTINGHAMSHIRE')
})
