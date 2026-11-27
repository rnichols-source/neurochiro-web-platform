import assert from 'node:assert/strict'
import test from 'node:test'
import { firstName } from './greeting.ts'

test('a display name that starts with Dr. keeps the real first name', () => {
  assert.equal(firstName('Dr. Ray'), 'Ray')
  assert.equal(firstName('Dr. Ray Nichols'), 'Ray')
  assert.equal(firstName('Dr Ray'), 'Ray')
  assert.equal(firstName('Raymond Nichols'), 'Raymond')
  assert.equal(firstName('Dr.'), 'there')
  assert.equal(firstName(''), 'there')
  assert.equal(firstName(null), 'there')
})
