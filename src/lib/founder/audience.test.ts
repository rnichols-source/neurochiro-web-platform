import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import type { DoctorRecord, FounderRoster, RequestRecord } from './roster.ts'

register('data:text/javascript,' + encodeURIComponent(`
let root = ''
export function initialize(data) { root = data.root }
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return { url: 'data:text/javascript,export {}', shortCircuit: true }
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

function doctor(partial: Partial<DoctorRecord>): DoctorRecord {
  return {
    id: 'd',
    userId: null,
    name: 'Dr Example',
    clinic: '',
    email: 'doc@example.com',
    phone: null,
    city: '',
    state: '',
    country: 'US',
    lat: 1,
    lng: 1,
    verified: true,
    founding: false,
    tier: '',
    createdAt: null,
    views: 0,
    slug: null,
    photo: false,
    priceText: null,
    sms: false,
    test: false,
    listing: 'live',
    paid: true,
    ...partial,
  }
}

function request(partial: Partial<RequestRecord>): RequestRecord {
  return {
    id: 'r',
    doctorId: null,
    subscriberId: null,
    name: 'Ada',
    email: null,
    phone: null,
    status: 'new',
    createdAt: '2026-11-01T00:00:00.000Z',
    acknowledgedAt: null,
    outcome: null,
    source: null,
    checkinSent: null,
    checkinResponse: null,
    smsConsent: false,
    smsPhone: null,
    officeResponse: null,
    officeSent: null,
    ...partial,
  }
}

function roster(partial: Partial<FounderRoster>): FounderRoster {
  return {
    generatedAt: '2026-11-27T00:00:00.000Z',
    mentionsOk: true,
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
    doctors: [],
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
    ...partial,
  }
}

test('founding audience is live verified doctors only', async () => {
  const { resolveAudience } = await import('./audience.ts')
  const rows = resolveAudience(roster({
    doctors: [
      doctor({ id: 'live', name: 'Dr Live', email: 'live@example.com', founding: true, verified: true }),
      doctor({ id: 'hidden', name: 'Dr Hidden', email: 'hidden@example.com', founding: true, verified: false, listing: 'hidden' }),
      doctor({ id: 'plain', name: 'Dr Plain', email: 'plain@example.com', founding: false, verified: true }),
    ],
  }), 'founding')
  assert.deepEqual(rows.map((row) => row.email), ['live@example.com'])
})

test('open requests leave spam out', async () => {
  const { openRequests } = await import('./model.ts')
  const now = new Date('2026-11-27T12:00:00.000Z')
  const rows = openRequests(roster({
    requests: [
      request({ id: 'ok', status: 'new' }),
      request({ id: 'spam', status: 'spam' }),
      request({ id: 'gone', status: 'withdrawn' }),
    ],
  }), now)
  assert.deepEqual(rows.map((row) => row.id), ['ok'])
})
