import assert from 'node:assert/strict'
import test from 'node:test'
import { blankCoordinate, pickDoctorPatch, postgrestOrIlike } from './member-search.ts'

function rawUnquotedComma(value: string): boolean {
  let quoted = false
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char !== '"') {
      if (!quoted && char === ',') return true
      continue
    }
    if (quoted && value[index + 1] === '"') {
      index += 1
      continue
    }
    quoted = !quoted
  }
  return false
}

test('ilike helper quotes commas and parentheses and keeps dots', () => {
  const comma = postgrestOrIlike('Smith, John')
  const parens = postgrestOrIlike('Smith (DC)')
  const wild = postgrestOrIlike('a%b_c')
  const email = postgrestOrIlike('john@gmail.com')
  assert.equal(rawUnquotedComma(comma), false)
  assert.equal(rawUnquotedComma(parens), false)
  assert.equal(rawUnquotedComma(wild), false)
  assert.equal(comma.startsWith('"') && comma.endsWith('"'), true)
  assert.equal(parens.includes('(') && parens.includes(')'), true)
  assert.match(wild, /\\%/)
  assert.match(wild, /\\_/)
  assert.equal(email.includes('john@gmail.com'), true)
  assert.equal(email.includes('.'), true)
})

test('blank coordinates are null and never zero', () => {
  assert.equal(blankCoordinate(''), null)
  assert.equal(blankCoordinate(' '), null)
  assert.equal(blankCoordinate('nope'), null)
  assert.equal(blankCoordinate('NaN'), null)
  assert.notEqual(blankCoordinate(''), 0)
  assert.notEqual(blankCoordinate(' '), 0)
  assert.notEqual(blankCoordinate('abc'), 0)
  assert.equal(blankCoordinate('12.5'), 12.5)
  assert.equal(blankCoordinate(0), 0)
})

test('doctor patch drops membership tier and stores blank coordinates as null', () => {
  const patch = pickDoctorPatch({
    membership_tier: 'pro',
    clinic_name: 'Main Street',
    latitude: '',
    longitude: ' ',
    graduation_year: '',
    not_a_column: 'nope',
  })
  assert.equal('membership_tier' in patch, false)
  assert.equal('not_a_column' in patch, false)
  assert.equal(patch.clinic_name, 'Main Street')
  assert.equal(patch.latitude, null)
  assert.equal(patch.longitude, null)
  assert.equal(patch.graduation_year, null)
  assert.notEqual(patch.latitude, 0)
})
