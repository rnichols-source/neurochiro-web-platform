import assert from 'node:assert/strict'
import test from 'node:test'
import { blankCoordinate, compareMembers, doctorOrFilter, doctorTokenFilters, pickDoctorPatch, postgrestOrIlike, searchTokens, type MemberListRow } from './member-search.ts'

function rawUnquotedComma(value: string): boolean {
  let quoted = false
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (quoted && char === '\\') {
      index += 1
      continue
    }
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (!quoted && char === ',') return true
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
  assert.equal(postgrestOrIlike("O'Brien"), `"%O'Brien%"`)
  assert.equal(postgrestOrIlike('Smith, John'), '"%Smith, John%"')
  assert.equal(postgrestOrIlike('Smith (DC)'), '"%Smith (DC)%"')
  assert.equal(postgrestOrIlike('50%'), '"%50\\\\%%"')
  assert.equal(postgrestOrIlike('a_b'), '"%a\\\\_b%"')
  assert.equal(postgrestOrIlike('"quoted"'), '"%\\"quoted\\"%"')
  assert.equal(postgrestOrIlike('john@gmail.com'), '"%john@gmail.com%"')
})

test('search tokens drop a leading title and require each word', () => {
  assert.deepEqual(searchTokens('  Dr. Smith '), ['smith'])
  assert.deepEqual(searchTokens('John Smith'), ['john', 'smith'])
  assert.deepEqual(searchTokens('Smith, John'), ['smith', 'john'])
  assert.deepEqual(searchTokens('Smith John'), ['smith', 'john'])
  assert.deepEqual(searchTokens('dr'), [])
  assert.deepEqual(searchTokens('dragon smith'), ['dragon', 'smith'])
  assert.deepEqual(searchTokens('a b c d e'), ['a', 'b', 'c', 'd'])
  const filters = doctorTokenFilters('John Smith')
  assert.equal(filters.length, 2)
  assert.equal(filters[0].includes('slug.ilike.'), true)
  assert.equal(filters[0].includes('state.ilike.'), false)
  assert.equal(doctorOrFilter('smith').includes('slug.ilike.'), true)
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

test('doctor patch drops membership tier and omits blank coordinates', () => {
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
  assert.equal('latitude' in patch, false)
  assert.equal('longitude' in patch, false)
  assert.equal(patch.graduation_year, null)
  const zero = pickDoctorPatch({ latitude: 0, longitude: '0' })
  assert.equal(zero.latitude, 0)
  assert.equal(zero.longitude, 0)
})

function row(partial: Pick<MemberListRow, 'id' | 'name' | 'lastName' | 'firstName'>): MemberListRow {
  return {
    role: 'doctor',
    email: null,
    practice: null,
    city: null,
    state: null,
    country: null,
    verificationStatus: null,
    verificationLabel: 'Verified',
    billingLabel: 'Free',
    lastActivity: null,
    slug: null,
    userId: null,
    ...partial,
  }
}

test('fallback name sort is last name then first name', () => {
  const john = row({ id: '1', name: 'John Smith', lastName: 'Smith', firstName: 'John' })
  const adam = row({ id: '2', name: 'Adam Smith', lastName: 'Smith', firstName: 'Adam' })
  const zoe = row({ id: '3', name: 'Zoe Adams', lastName: 'Adams', firstName: 'Zoe' })
  assert.ok(compareMembers(zoe, john, 'name') < 0)
  assert.ok(compareMembers(adam, john, 'name') < 0)
  assert.ok(compareMembers(john, adam, 'name') > 0)
})
