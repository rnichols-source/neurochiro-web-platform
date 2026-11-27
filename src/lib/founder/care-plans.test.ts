import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import { formatMoney } from './format.ts'
import type { DoctorRecord, FounderRoster } from './roster.ts'

register('data:text/javascript,' + encodeURIComponent(`
let root = ''
export function initialize(data) { root = data.root }
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return { url: 'data:text/javascript,export {}', shortCircuit: true }
  }
  if (specifier === '@/lib/supabase-admin') {
    return { url: 'data:text/javascript,export function createAdminClient(){return{}}', shortCircuit: true }
  }
  if (specifier.startsWith('@/')) {
    return { url: root + specifier.slice(2) + '.ts', shortCircuit: true }
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\\.[a-z]+$/i.test(specifier)) {
    return nextResolve(specifier + '.ts', context)
  }
  return nextResolve(specifier, context)
}
`), {
  parentURL: import.meta.url,
  data: { root: new URL('../../', import.meta.url).href },
})

const now = new Date('2026-11-15T12:00:00.000Z')

function doctor(priceText: string | null): DoctorRecord {
  return {
    id: 'd1',
    userId: null,
    name: 'Dr Example',
    clinic: '',
    email: null,
    phone: null,
    city: '',
    state: '',
    country: 'US',
    lat: null,
    lng: null,
    verified: true,
    founding: false,
    tier: '',
    createdAt: null,
    views: 0,
    slug: null,
    photo: false,
    priceText,
    sms: false,
    test: false,
    listing: 'live',
    paid: false,
  }
}

function roster(priceText: string | null): FounderRoster {
  return {
    generatedAt: '2026-11-15T00:00:00.000Z',
    mentionsOk: false,
    demandCount: 0,
    points: [],
    clusters: [],
    cities: 0,
    countries: [],
    countryCount: 0,
    states: [],
    gaps: [],
    gapAsks: 0,
    unmeasured: 0,
    sources: [],
    posts: [],
    doctors: [doctor(priceText)],
    requests: [],
    people: [],
    applications: [],
    subscribers: [],
    searches: null,
    profileViews: null,
    bookTaps: null,
    callTaps: null,
    communityVisits: null,
    office: { ready: false, yes: 0, no: 0, sent: 0 },
    paidKnown: true,
    remindersKnown: true,
  }
}

test('unsaved care plan figures stay blank, and a saved 0 stays 0', async () => {
  const { figuresFrom } = await import('./settings.ts')
  assert.equal(figuresFrom(null).carePlansStarted, null)
  assert.equal(figuresFrom({}).carePlansStarted, null)
  assert.equal(figuresFrom({ carePlansStarted: 'nope' }).carePlansStarted, null)
  assert.equal(figuresFrom({ carePlansStarted: -4 }).carePlansStarted, null)
  assert.equal(figuresFrom({ carePlansStarted: Number.POSITIVE_INFINITY }).carePlansStarted, null)
  assert.equal(figuresFrom({ carePlansStarted: 100_000_001 }).carePlansStarted, null)
  assert.equal(figuresFrom({ carePlansStarted: 0 }).carePlansStarted, 0)
  assert.equal(figuresFrom({ carePlansStarted: '0' }).carePlansStarted, 0)
  assert.equal(figuresFrom(null).averageCarePlan, null)
  assert.equal(figuresFrom({ averageCarePlan: 'nope' }).averageCarePlan, null)
  assert.equal(figuresFrom({ averageCarePlan: -1 }).averageCarePlan, null)
  assert.equal(figuresFrom({ averageCarePlan: 0 }).averageCarePlan, 0)
  assert.equal(figuresFrom({ followers: 12 }).followers, 12)
  assert.equal(figuresFrom(null).followers, null)
})

test('care plan value uses saved figures, and first-visit value stays the median or blank', async () => {
  const { roiCard } = await import('./model.ts')
  const priced = roiCard(roster('$126 first visit'), now, 7, 2134)
  assert.equal(priced.visit, 126)
  assert.equal(priced.carePlansStarted, 7)
  assert.equal(priced.averageCarePlan, 2134)
  assert.equal(priced.carePlanValue, 14938)
  assert.equal(formatMoney(priced.carePlanValue || 0), '$14,938')
  assert.equal(priced.carePlanVisitValue, 882)
  const blank = roiCard(roster('call for price'), now, 7, 2134)
  assert.equal(blank.visit, null)
  assert.equal(blank.carePlanVisitValue, null)
  assert.equal(blank.carePlanValue, 14938)
  const zero = roiCard(roster('$126'), now, 0, 2134)
  assert.equal(zero.carePlansStarted, 0)
  assert.equal(zero.carePlanValue, 0)
  assert.equal(zero.carePlanVisitValue, 0)
  const missing = roiCard(roster('$126'), now, null, null)
  assert.equal(missing.carePlansStarted, null)
  assert.equal(missing.carePlanValue, null)
  assert.equal(missing.carePlanVisitValue, null)
})
