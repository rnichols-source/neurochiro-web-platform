import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PHONE_INVALID_MESSAGE, PHONE_REQUIRED_MESSAGE, requiredPhoneError, sourceLabel } from './validate.ts'

test('quiz requests are labeled as the match quiz', () => {
  assert.equal(sourceLabel('quiz'), 'from the NeuroChiro match quiz')
  assert.equal(sourceLabel('appointment'), 'from your NeuroChiro profile')
})

test('a callback phone is required and only obviously invalid numbers are rejected', () => {
  assert.equal(requiredPhoneError(undefined), PHONE_REQUIRED_MESSAGE)
  assert.equal(requiredPhoneError(null), PHONE_REQUIRED_MESSAGE)
  assert.equal(requiredPhoneError(''), PHONE_REQUIRED_MESSAGE)
  assert.equal(requiredPhoneError('   '), PHONE_REQUIRED_MESSAGE)
  assert.equal(requiredPhoneError(8645550144), PHONE_REQUIRED_MESSAGE)

  assert.equal(requiredPhoneError('123456'), PHONE_INVALID_MESSAGE)
  assert.equal(requiredPhoneError('call me'), PHONE_INVALID_MESSAGE)
  assert.equal(requiredPhoneError('555-12'), PHONE_INVALID_MESSAGE)

  for (const value of [
    '5551234',
    '(864) 555-0144',
    '864-555-0144',
    '864.555.0144',
    '+1 864 555 0144',
    '1 (416) 555-0199',
    '+44 20 7946 0958',
    '0044 20 7946 0958',
    '864-555-0144 x12',
    '864-555-0144 ext. 12',
  ]) {
    assert.equal(requiredPhoneError(value), null, value)
  }
})
