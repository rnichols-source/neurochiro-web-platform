import assert from 'node:assert/strict'
import test from 'node:test'
import { noteSynapsePaymentFailed, synapseUpdateShouldLapse } from './payment-failed.ts'

function seatAdmin(rows: { id: string }[]) {
  const updates: unknown[] = []
  const admin = {
    updates,
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              assert.equal(table, 'synapse_seats')
              assert.equal(typeof column, 'string')
              assert.equal(typeof value, 'string')
              return Promise.resolve({ data: rows })
            },
          }
        },
        update(values: unknown) {
          updates.push(values)
          return { in() { return Promise.resolve({ error: null }) } }
        },
      }
    },
  }
  return admin
}

test('a synapse payment failure logs and does not lapse the seat', async () => {
  const lines: string[] = []
  const original = console.log
  console.log = (message?: unknown) => {
    lines.push(String(message))
  }
  const admin = seatAdmin([{ id: 'seat-1' }])
  try {
    const flagged = await noteSynapsePaymentFailed(admin, 'sub_123')
    assert.equal(flagged, true)
    assert.deepEqual(admin.updates, [])
    assert.deepEqual(lines, ['[WEBHOOK] synapse payment failed sub_123'])
  } finally {
    console.log = original
  }
})

test('a non-synapse invoice is not flagged', async () => {
  const admin = seatAdmin([])
  const flagged = await noteSynapsePaymentFailed(admin, 'sub_member')
  assert.equal(flagged, false)
  assert.deepEqual(admin.updates, [])
  assert.equal(await noteSynapsePaymentFailed(admin, null), false)
})

test('subscription updates lapse synapse only when unpaid or canceled', () => {
  assert.equal(synapseUpdateShouldLapse('unpaid'), true)
  assert.equal(synapseUpdateShouldLapse('canceled'), true)
  assert.equal(synapseUpdateShouldLapse('past_due'), false)
  assert.equal(synapseUpdateShouldLapse('active'), false)
  assert.equal(synapseUpdateShouldLapse(null), false)
})
