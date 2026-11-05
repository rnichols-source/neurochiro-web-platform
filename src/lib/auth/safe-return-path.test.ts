import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loginPathWithReturn, safeReturnPath } from './safe-return-path.ts'

describe('safe return paths', () => {
  it('keeps a same-site application path, including a query', () => {
    assert.equal(safeReturnPath('/doctor/apply'), '/doctor/apply')
    assert.equal(safeReturnPath('/doctor/apply?canceled=1'), '/doctor/apply?canceled=1')
    assert.equal(safeReturnPath('  /doctor/apply  '), '/doctor/apply')
  })

  it('rejects off-site and protocol-relative targets', () => {
    assert.equal(safeReturnPath('https://evil.com'), null)
    assert.equal(safeReturnPath('//evil.com'), null)
    assert.equal(safeReturnPath('///evil.com'), null)
    assert.equal(safeReturnPath('/\\evil.com'), null)
    assert.equal(safeReturnPath('/%2F%2Fevil.com'), null)
    assert.equal(safeReturnPath('/%5Cevil.com'), null)
    assert.equal(safeReturnPath('javascript:alert(1)'), null)
    assert.equal(safeReturnPath('/doctor/apply\nhttps://evil.com'), null)
    assert.equal(safeReturnPath(''), null)
    assert.equal(safeReturnPath(null), null)
  })

  it('builds a login link that comes back to the application', () => {
    assert.equal(loginPathWithReturn('/doctor/apply'), '/login?next=%2Fdoctor%2Fapply')
    assert.equal(loginPathWithReturn('https://evil.com'), '/login?next=%2Fdoctor%2Fapply')
  })
})
