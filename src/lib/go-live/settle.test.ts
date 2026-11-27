import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { settle } from './settle.ts'
import { loginPasswordState } from './plan.ts'

/** Same shape as a Supabase builder: has then, has no catch. */
function thenable<T>(value: T, fail = false): PromiseLike<T> {
  return {
    then(onFulfilled, onRejected) {
      return (fail ? Promise.reject(new Error('rpc failed')) : Promise.resolve(value)).then(onFulfilled, onRejected)
    },
  }
}

describe('settle', () => {
  it('awaits a Supabase-style builder that has no catch method', async () => {
    const builder = thenable({ data: true, error: null })
    assert.equal((builder as { catch?: unknown }).catch, undefined)
    const result = await settle(() => builder)
    assert.equal(loginPasswordState(result), 'set')
  })

  it('turns a thrown or rejected call into null, which reads as unknown', async () => {
    assert.equal(await settle(() => thenable({ data: false }, true)), null)
    assert.equal(await settle(() => { throw new TypeError('boom') }), null)
    assert.equal(loginPasswordState(null), 'unknown')
  })
})
