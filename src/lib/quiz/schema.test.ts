import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { rateLimit } from '../rate-limit.ts'
import { runMatch } from './match.ts'
import { QUIZ_REQUEST_CONSENT_STORED } from './options.ts'
import {
  emailResultsInputSchema,
  isBotSubmission,
  matchInputSchema,
  quizEventSchema,
  requestInputSchema,
} from './schema.ts'
import { settle } from './state.ts'

const sessionId = '11111111-1111-4111-8111-111111111111'
const doctorId = '22222222-2222-4222-8222-222222222222'

const match = {
  concern: 'pain',
  country: 'US',
  postal: '29601',
  city: '',
  region: '',
  experience: 'regular',
  priority: 'closest',
  source: 'direct',
  sessionId,
}

test('match schema accepts a ZIP and maps legacy ids', () => {
  const parsed = matchInputSchema.parse({ ...match, experience: 'nervous_system', priority: 'reviews' })
  assert.equal(parsed.experience, 'traditional')
  assert.equal(parsed.priority, 'closest')
  assert.equal(parsed.postal, '29601')
})

test('match schema rejects a quiz with no place', () => {
  const parsed = matchInputSchema.safeParse({ ...match, postal: '', city: '', region: '' })
  assert.equal(parsed.success, false)
})

test('request schema requires contact and the stored consent text', () => {
  const good = requestInputSchema.safeParse({
    doctorId,
    name: 'Jamie Lee',
    phone: '',
    email: 'Jamie@Example.com',
    bestTime: '',
    message: '',
    consent: true,
    consentText: QUIZ_REQUEST_CONSENT_STORED,
    _hp: '',
    startedAt: Date.now() - 5000,
    sessionId,
    source: 'hero',
  })
  assert.equal(good.success, true)
  if (good.success) assert.equal(good.data.email, 'jamie@example.com')

  const missing = requestInputSchema.safeParse({
    doctorId,
    name: 'Jamie Lee',
    consent: true,
    consentText: QUIZ_REQUEST_CONSENT_STORED,
    startedAt: Date.now(),
    sessionId,
  })
  assert.equal(missing.success, false)
})

test('honeypot and fast submits are bots without failing the schema', () => {
  const parsed = requestInputSchema.parse({
    doctorId,
    name: 'Bot',
    email: 'bot@example.com',
    consent: true,
    consentText: QUIZ_REQUEST_CONSENT_STORED,
    _hp: 'filled',
    startedAt: Date.now(),
    sessionId,
  })
  assert.equal(isBotSubmission(parsed), true)
  assert.equal(isBotSubmission({ _hp: '', startedAt: Date.now() - 5000 }), false)
})

test('email schema normalizes the address', () => {
  const parsed = emailResultsInputSchema.parse({
    email: 'A@Example.com',
    country: 'US',
    postal: '29601',
    doctorIds: [doctorId],
    consent: true,
    alerts: false,
    _hp: '',
    startedAt: Date.now() - 5000,
    sessionId,
  })
  assert.equal(parsed.email, 'a@example.com')
})

test('quiz events allow the funnel fields and reject contact fields', () => {
  const good = quizEventSchema.safeParse({ sessionId, event: 'step_answer', step: 'concern', concern: 'pain' })
  assert.equal(good.success, true)
  const pii = quizEventSchema.safeParse({ sessionId, event: 'start', email: 'a@example.com', phone: '555', name: 'A', message: 'hi', postal: '29601' })
  assert.equal(pii.success, false)
})

test('the 11th match in a minute is rate limited and search is not called', async () => {
  const limiter = rateLimit(`quiz-match-unit-${Date.now()}`, { maxRequests: 10, windowMs: 60_000 })
  let calls = 0
  let last: Awaited<ReturnType<typeof runMatch>> | null = null
  for (let i = 0; i < 11; i++) {
    last = await runMatch(match, {
      limitAllowed: limiter.check('203.0.113.8').allowed,
      search: async () => {
        calls += 1
        return { doctors: [], nearest: [], unknownPlace: true }
      },
    })
  }
  assert.equal(calls, 10)
  assert.equal(last?.ok, false)
  if (last && !last.ok) assert.equal(last.code, 'rate_limited')
})

test('an empty nearby search widens once before calling the country empty', async () => {
  const calls: string[] = []
  const result = await runMatch(match, {
    limitAllowed: true,
    search: async (params) => {
      calls.push(params.radius || 'nearby')
      if (params.radius === '4000') {
        return {
          doctors: [{
            id: doctorId,
            slug: 'far-doctor',
            first_name: 'Ada',
            last_name: 'Lovelace',
            verification_status: 'verified',
            distance_miles: 800,
            country: 'US',
            city: 'Seattle',
            state: 'WA',
            accepting_new_patients: true,
          }],
          nearest: [],
        }
      }
      return { doctors: [], nearest: [] }
    },
  })
  assert.deepEqual(calls, ['nearby', '4000'])
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.noLocal, true)
    assert.match(result.headline, /starting 800 miles away/)
    assert.doesNotMatch(result.headline, /don't have doctors/)
  }
})

test('a thrown search returns an inline error and the spinner flag clears', async () => {
  const result = await runMatch(match, {
    limitAllowed: true,
    search: async () => { throw new Error('search down') },
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.code, 'error')

  let loading = true
  const settled = await settle(async () => {
    throw new Error('search down')
  }, (value) => { loading = value })
  assert.equal(loading, false)
  assert.equal(settled && typeof settled === 'object' && 'ok' in settled && settled.ok, false)
})

test('subscribe route still checks coverage and the helper allows quiz', () => {
  const route = readFileSync(new URL('../../app/api/subscribe/route.ts', import.meta.url), 'utf8')
  const helper = readFileSync(new URL('../subscribers/subscribe.ts', import.meta.url), 'utf8')
  assert.match(route, /skipCoverageCheck:\s*false/)
  assert.doesNotMatch(route, /from\('subscribers'\)/)
  assert.match(helper, /'quiz'/)
  assert.match(helper, /skipCoverageCheck/)
})
