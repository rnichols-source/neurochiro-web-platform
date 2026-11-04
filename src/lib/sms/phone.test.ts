import assert from 'node:assert/strict'
import { test } from 'node:test'
import { last4, toE164 } from './phone.ts'

test('toE164 accepts US and Canadian shapes and skips everything else', () => {
  assert.equal(toE164('8645550100'), '+18645550100')
  assert.equal(toE164('18645550100'), '+18645550100')
  assert.equal(toE164('864-555-0100'), '+18645550100')
  assert.equal(toE164('(864) 555-0100'), '+18645550100')
  assert.equal(toE164('+18645550100'), '+18645550100')
  assert.equal(toE164('+1 (864) 555-0100'), '+18645550100')
  assert.equal(toE164('+447911123456'), null)
  assert.equal(toE164('+49 30 1234567'), null)
  assert.equal(toE164('+4930123456'), null)
  assert.equal(toE164('0645550100'), null)
  assert.equal(toE164('8641550100'), null)
  assert.equal(toE164('07911123456'), null)
  assert.equal(toE164('nope'), null)
  assert.equal(toE164(''), null)
  assert.equal(toE164('123'), null)
  assert.equal(last4('+18645550100'), '0100')
  assert.equal(last4('nope'), '')
})
