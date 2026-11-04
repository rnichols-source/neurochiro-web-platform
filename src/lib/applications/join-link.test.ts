import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { joinRoleHref } from './join-link.ts'

describe('join referral links', () => {
  it('puts the referral code in the query string', () => {
    assert.equal(joinRoleHref('doctor', 'RAY1'), '/get-started?ref=RAY1')
    assert.equal(joinRoleHref('student', 'RAY1'), '/get-started?role=student&ref=RAY1')
  })

  it('omits an empty code', () => {
    assert.equal(joinRoleHref('doctor', ''), '/get-started')
    assert.equal(joinRoleHref('student', '  '), '/get-started?role=student')
  })

  it('does not build the broken ampersand path', () => {
    assert.equal(joinRoleHref('doctor', 'ABC').includes('/get-started&'), false)
  })
})
