import assert from 'node:assert/strict'
import test from 'node:test'
import { toPublicNames } from './public-names.ts'

test('public names drop email, role, and stripe fields', () => {
  const names = toPublicNames([
    {
      id: 'user-1',
      full_name: 'Ada Lovelace',
      avatar_url: 'https://neurochiro.co/a.png',
      email: 'ada@example.com',
      role: 'doctor',
      stripe_customer_id: 'cus_secret',
    },
    { id: '', full_name: 'Skip' },
    null,
  ])
  assert.equal(names.length, 1)
  assert.deepEqual(names[0], {
    id: 'user-1',
    full_name: 'Ada Lovelace',
    avatar_url: 'https://neurochiro.co/a.png',
  })
  assert.equal('email' in names[0], false)
  assert.equal('role' in names[0], false)
  assert.equal(JSON.stringify(names).includes('ada@example.com'), false)
  assert.equal(JSON.stringify(names).includes('cus_secret'), false)
})
