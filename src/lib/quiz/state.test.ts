import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blankAnswers, clampStep, parseAnswers, serializeAnswers } from './state.ts'

const fallback = blankAnswers({
  source: 'navbar',
  country: 'US',
  sessionId: '11111111-1111-4111-8111-111111111111',
  startedAt: 100,
})

test('serialize and parse keep a version 2 quiz', () => {
  const saved = { ...fallback, concern: 'stress' as const, postal: '29601', experience: 'first_time' as const, priority: 'specialty' as const }
  const parsed = parseAnswers(JSON.parse(serializeAnswers(saved)), fallback)
  assert.equal(parsed.concern, 'stress')
  assert.equal(parsed.postal, '29601')
  assert.equal(parsed.priority, 'specialty')
  assert.equal(parsed.v, 2)
})

test('legacy experience and priority ids map on parse', () => {
  const parsed = parseAnswers({
    v: 2,
    concern: 'pain',
    country: 'US',
    experience: 'nervous_system',
    priority: 'insurance',
    sessionId: fallback.sessionId,
    startedAt: 100,
  }, fallback)
  assert.equal(parsed.experience, 'traditional')
  assert.equal(parsed.priority, 'closest')
})

test('a step past the first unanswered question is pulled back', () => {
  assert.equal(clampStep('results', fallback), 'concern')
  const located = { ...fallback, concern: 'pain' as const, postal: '29601' }
  assert.equal(clampStep('priority', located), 'experience')
  const ready = { ...located, experience: 'regular' as const, priority: 'closest' as const }
  assert.equal(clampStep('results', ready), 'results')
})

test('an unknown entry source becomes direct', () => {
  const parsed = parseAnswers({ v: 2, source: 'billboard', sessionId: fallback.sessionId, startedAt: 1 }, fallback)
  assert.equal(parsed.source, 'direct')
})
