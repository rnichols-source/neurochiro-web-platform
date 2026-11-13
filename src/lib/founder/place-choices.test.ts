import assert from 'node:assert/strict'
import test from 'node:test'
import { ambiguousPlaceChoices } from './place-choices.ts'

test('Sydney offers Australia and the US place', () => {
  const choices = ambiguousPlaceChoices([
    { label: 'Sydney, New South Wales, Australia', query: 'Sydney, Australia', country: 'AU', importance: 0.73 },
    { label: 'Sydney, Ohio, United States', query: 'Sydney, Ohio', country: 'US', importance: 0.42 },
  ])
  assert.ok(choices)
  assert.deepEqual(choices?.map((hit) => hit.country), ['AU', 'US'])
})

test('a US city with only a tiny foreign namesake stays a single result', () => {
  assert.equal(ambiguousPlaceChoices([
    { label: 'Greenville, South Carolina, United States', query: 'Greenville, South Carolina', country: 'US', importance: 0.55 },
    { label: 'Greenville, Liberia', query: 'Greenville, Liberia', country: 'LR', importance: 0.31 },
  ]), null)
})

test('one country is not a pick list', () => {
  assert.equal(ambiguousPlaceChoices([
    { label: 'Austin, Texas, United States', query: 'Austin, Texas', country: 'US', importance: 0.68 },
  ]), null)
})
