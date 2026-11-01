import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sourceLabel } from './validate.ts'

test('quiz requests are labeled as the match quiz', () => {
  assert.equal(sourceLabel('quiz'), 'from the NeuroChiro match quiz')
  assert.equal(sourceLabel('appointment'), 'from your NeuroChiro profile')
})
