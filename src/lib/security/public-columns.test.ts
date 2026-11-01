import assert from 'node:assert/strict'
import test from 'node:test'
import { PUBLIC_DOCTOR_COLUMNS } from './public-columns.ts'

const banned = ['email', 'phone_private', 'stripe', 'license', 'notes']

test('public doctor columns exclude private names', () => {
  for (const column of PUBLIC_DOCTOR_COLUMNS) {
    for (const word of banned) {
      assert.equal(column.toLowerCase().includes(word), false, column)
    }
  }
  assert.equal(PUBLIC_DOCTOR_COLUMNS.includes('phone' as never), false)
  assert.equal(PUBLIC_DOCTOR_COLUMNS.includes('user_id' as never), false)
  assert.ok(PUBLIC_DOCTOR_COLUMNS.includes('slug'))
})
