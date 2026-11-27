import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import type { ApplicationRecord, DoctorRecord, FounderRoster, RequestRecord } from './roster.ts'

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

const NOW = new Date('2026-11-27T15:00:00.000Z')

function doctor(partial: Partial<DoctorRecord>): DoctorRecord {
  return {
    id: 'd',
    userId: null,
    name: 'Dr Example',
    clinic: '',
    email: 'doc@example.com',
    phone: null,
    city: 'Greenville',
    state: 'SC',
    country: 'US',
    lat: 1,
    lng: 1,
    verified: true,
    founding: false,
    tier: '',
    createdAt: '2026-01-01T00:00:00.000Z',
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
    doctorId: 'd',
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

function application(partial: Partial<ApplicationRecord>): ApplicationRecord {
  return {
    id: 'a',
    userId: null,
    status: 'draft',
    city: '',
    state: '',
    country: 'US',
    createdAt: null,
    step: null,
    plan: null,
    price: null,
    lastReminder: null,
    ...partial,
  }
}

function roster(partial: Partial<FounderRoster> = {}): FounderRoster {
  return {
    generatedAt: NOW.toISOString(),
    mentionsOk: true,
    demandCount: 10,
    points: [],
    clusters: [],
    cities: 0,
    countries: [],
    countryCount: 0,
    states: [],
    gaps: [{ city: 'Boise', state: 'ID', country: 'US', n: 4, miles: 80, lat: 1, lng: 1 }],
    gapAsks: 4,
    unmeasured: 2,
    sources: [],
    posts: [],
    doctors: [doctor({})],
    requests: [],
    people: [],
    applications: [],
    subscribers: [],
    searches: 3,
    profileViews: 8,
    bookTaps: 1,
    callTaps: 1,
    communityVisits: 0,
    office: { ready: true, yes: 0, no: 0, sent: 0 },
    paidKnown: true,
    remindersKnown: true,
    ...partial,
  }
}

test('window counts keep the boundary in the older window and skip bad dates', async () => {
  const { countCreated, compareCreated } = await import('./pulse.ts')
  const times = [
    '2026-11-27T15:00:00.000Z',
    '2026-11-26T15:00:00.000Z',
    '2026-11-26T15:00:00.001Z',
    'not-a-date',
    null,
    '2026-11-28T00:00:00.000Z',
  ]
  assert.equal(countCreated(times, NOW, 86_400_000, 0), 2)
  assert.equal(countCreated(times, NOW, 2 * 86_400_000, 86_400_000), 1)
  const delta = compareCreated(times, NOW, 86_400_000)
  assert.deepEqual(delta, { current: 2, previous: 1, diff: 1 })
})

test('deltas use plain words and no dash', async () => {
  const { describeDelta, DASH } = await import('./pulse.ts')
  assert.equal(describeDelta(0, 'day'), 'same as the day before')
  assert.equal(describeDelta(2, 'week'), '2 more than the week before')
  assert.equal(describeDelta(-3, 'day'), '3 fewer than the day before')
  assert.equal(DASH.test(describeDelta(-3, 'week')), false)
})

test('a failed patient portal count is not added as zero', async () => {
  const { morningLine, visitKpi } = await import('./pulse.ts')
  const data = roster({
    communityVisits: null,
    requests: [request({ id: 'today', createdAt: '2026-11-27T12:00:00.000Z' })],
  })
  const line = morningLine(data, NOW, null)
  const kpi = visitKpi(data, NOW, null)
  assert.match(line, /1 new directory visit request/)
  assert.match(line, /could not be compared/)
  assert.equal(kpi.value, '1')
  assert.match(kpi.detail, /could not be counted/)
  assert.equal(kpi.live, true)
})

test('portal visits combine only when the window count loaded', async () => {
  const { morningLine, visitKpi } = await import('./pulse.ts')
  const data = roster({
    communityVisits: 5,
    requests: [request({ id: 'today', createdAt: '2026-11-27T12:00:00.000Z' })],
  })
  const windows = {
    mentions: null,
    searches: null,
    profileViews: null,
    portalVisits: {
      day: { current: 2, previous: 0, diff: 2 },
      week: { current: 4, previous: 1, diff: 3 },
    },
  }
  assert.match(morningLine(data, NOW, windows), /3 new visit requests/)
  assert.match(morningLine(data, NOW, windows), /3 more than the day before/)
  const kpi = visitKpi(data, NOW, windows)
  assert.equal(kpi.value, '6')
  assert.match(kpi.detail, /5 from the patient portal/)
  assert.equal(kpi.href, '/admin/leads?tab=requests')
})

test('zero portal visits stay in the total and do not warn', async () => {
  const { morningLine, visitKpi } = await import('./pulse.ts')
  const data = roster({ communityVisits: 0, requests: [] })
  const line = morningLine(data, NOW, null)
  assert.match(line, /0 new visit requests/)
  assert.equal(/could not/.test(line), false)
  assert.equal(visitKpi(data, NOW, null).value, '0')
  assert.match(visitKpi(data, NOW, null).detail, /0 from the patient portal/)
})

test('request path counts directory requests only and does not grow on a real subset', async () => {
  const { buildRequestFunnel } = await import('./model.ts')
  const data = roster({
    communityVisits: 9,
    requests: [
      request({ id: 'spam', status: 'spam' }),
      request({ id: 'open', createdAt: '2026-11-01T00:00:00.000Z' }),
      request({ id: 'replied', acknowledgedAt: '2026-11-02T00:00:00.000Z', outcome: 'patient_contacted_confirmed' }),
    ],
  })
  const steps = buildRequestFunnel(data, NOW, true)
  assert.equal(steps[0].value, '2')
  assert.match(steps[0].detail, /9 patient portal visits/)
  assert.equal(steps[1].value, '1')
  assert.equal(steps[2].value, '1')
  assert.equal(Number(steps[1].value) <= Number(steps[0].value), true)
  assert.equal(steps[3].value, '0')
  assert.equal(steps[3].tag, 'On')
})

test('confirmed without a reply time is labeled instead of looking like a broken funnel', async () => {
  const { buildRequestFunnel } = await import('./model.ts')
  const steps = buildRequestFunnel(roster({
    requests: [
      request({ id: 'quiet' }),
      request({ id: 'marked', outcome: 'patient_contacted_confirmed' }),
    ],
  }), NOW, false)
  assert.equal(steps[1].value, '0')
  assert.equal(steps[2].value, '1')
  assert.match(steps[2].detail, /no reply time saved/)
  assert.equal(steps[3].value, 'Off')
  assert.equal(steps[3].href, '/admin/settings')
})

test('a missing office switch is not shown as off or zero', async () => {
  const { buildRequestFunnel } = await import('./model.ts')
  const steps = buildRequestFunnel(roster(), NOW, null)
  assert.equal(steps[3].value, 'Unavailable')
  assert.match(steps[3].detail, /not off/)
  assert.match(steps[3].detail, /not zero/)
})

test('needs you today is ordered and each tap has a filtered place', async () => {
  const { morningNeeds, DASH } = await import('./pulse.ts')
  const needs = morningNeeds({
    roster: roster({
      doctors: [
        doctor({ id: 'quiet', createdAt: '2026-01-01T00:00:00.000Z' }),
        doctor({ id: 'founding', founding: true, verified: true }),
        doctor({ id: 'hidden', founding: true, verified: false, listing: 'hidden' }),
      ],
      requests: [
        request({ id: 'old', doctorId: 'quiet', createdAt: '2026-11-20T00:00:00.000Z' }),
        request({ id: 'loose', doctorId: null, createdAt: '2026-11-20T00:00:00.000Z' }),
      ],
      applications: [
        application({ id: 'review', status: 'under_review' }),
        application({ id: 'draft', status: 'draft' }),
      ],
    }),
    now: NOW,
    instagram: null,
    profileFailed: null,
  })
  assert.deepEqual(needs.map((item) => item.id), ['waiting', 'applications', 'instagram', 'profiles', 'founding', 'drafts', 'gaps'])
  const waiting = needs[0]
  assert.equal(waiting.nudge, 1)
  assert.equal(waiting.nudgeSkipped, 0)
  assert.equal(waiting.href, '/admin/people?filter=ignoring')
  assert.match(waiting.detail, /no doctor/)
  assert.equal(needs.find((item) => item.id === 'applications')?.href, '/admin/applications')
  assert.match(needs.find((item) => item.id === 'instagram')?.title || '', /could not be counted/)
  assert.equal(/0 Instagram/.test(needs.find((item) => item.id === 'instagram')?.title || ''), false)
  assert.match(needs.find((item) => item.id === 'profiles')?.title || '', /could not be loaded/)
  const founding = needs.find((item) => item.id === 'founding')
  assert.equal(founding?.href, '/admin/broadcast?audience=founding&draft=founding')
  assert.equal(founding?.seeHref, '/admin/people?filter=founding')
  assert.match(founding?.title || '', /4 days/)
  const drafts = needs.find((item) => item.id === 'drafts')
  assert.equal(drafts?.href, '/admin/applications?queue=progress')
  assert.equal(drafts?.seeHref, '/admin/broadcast?audience=stalled&draft=stalled')
  assert.equal(needs.find((item) => item.id === 'gaps')?.href, '/admin/growth#targets')
  assert.equal(needs.every((item) => item.href.startsWith('/admin')), true)
  assert.equal(DASH.test(JSON.stringify(needs)), false)
})

test('a doctor nudged in the last 20 hours is left out of Nudge all', async () => {
  const { morningNeeds } = await import('./pulse.ts')
  const data = roster({
    requests: [
      request({ id: 'old', doctorId: 'quiet', createdAt: '2026-11-20T00:00:00.000Z' }),
      request({ id: 'also', doctorId: 'other', createdAt: '2026-11-20T00:00:00.000Z' }),
    ],
    doctors: [doctor({ id: 'quiet' }), doctor({ id: 'other' })],
    gapAsks: 0,
    unmeasured: 0,
    gaps: [],
  })
  const needs = morningNeeds({
    roster: data,
    now: NOW,
    instagram: 0,
    profileFailed: 0,
    recentNudges: [{ doctorId: 'quiet', at: '2026-11-27T10:00:00.000Z' }],
  })
  const waiting = needs.find((item) => item.id === 'waiting')
  assert.equal(waiting?.nudge, 1)
  assert.equal(waiting?.nudgeSkipped, 1)
  assert.match(waiting?.detail || '', /1 will get a reminder/)
  assert.match(waiting?.detail || '', /1 was nudged in the last 20 hours/)
  const blocked = morningNeeds({ roster: data, now: NOW, instagram: 0, profileFailed: 0, recentNudges: null })
  const held = blocked.find((item) => item.id === 'waiting')
  assert.equal(held?.nudge, undefined)
  assert.match(held?.detail || '', /Nudge all stays off/)
})

test('a clear instagram queue and a healthy research list stay off the needs list', async () => {
  const { morningNeeds } = await import('./pulse.ts')
  const needs = morningNeeds({ roster: roster({ gapAsks: 0, unmeasured: 0, gaps: [] }), now: NOW, instagram: 0, profileFailed: 0 })
  assert.equal(needs.some((item) => item.id === 'instagram' || item.id === 'profiles'), false)
})

test('founding rate drops behind drafts when the deadline is more than a week away', async () => {
  const { morningNeeds } = await import('./pulse.ts')
  const needs = morningNeeds({
    roster: roster({
      applications: [application({ status: 'draft' })],
      doctors: [doctor({ founding: true, verified: true })],
    }),
    now: new Date('2026-11-20T15:00:00.000Z'),
    instagram: 0,
    profileFailed: 0,
  })
  const ids = needs.map((item) => item.id)
  assert.equal(ids.indexOf('drafts') < ids.indexOf('founding'), true)
})

test('eastern weeks keep Sunday night on the earlier week', async () => {
  const { requestWeeks } = await import('./pulse.ts')
  const weeks = requestWeeks(roster({
    requests: [
      request({ id: 'sunday', createdAt: '2026-11-23T04:30:00.000Z' }),
      request({ id: 'monday', createdAt: '2026-11-23T05:30:00.000Z' }),
      request({ id: 'spam', status: 'spam', createdAt: '2026-11-23T05:30:00.000Z' }),
    ],
  }), NOW)
  assert.equal(weeks.at(-1)?.label, '11/23')
  assert.equal(weeks.at(-1)?.current, true)
  assert.equal(weeks.at(-1)?.n, 1)
  assert.equal(weeks.at(-2)?.label, '11/16')
  assert.equal(weeks.at(-2)?.n, 1)
  assert.equal(weeks.some((week) => week.label.includes('*')), false)
})

test('people asking and doctors live do not invent a comparison or hide a failed read', async () => {
  const { askingKpi, doctorsKpi } = await import('./pulse.ts')
  const down = askingKpi(roster({ mentionsOk: false, demandCount: 0 }), null)
  assert.equal(down.value, 'Unavailable')
  assert.equal(down.live, false)
  assert.match(down.delta, /not zero/)
  assert.equal(down.href, '/admin/growth')
  const doctors = doctorsKpi(roster({
    doctors: [
      doctor({ id: 'live', listing: 'live', verified: true, createdAt: '2026-11-25T00:00:00.000Z' }),
      doctor({ id: 'old', listing: 'live', verified: true, createdAt: '2026-11-10T00:00:00.000Z' }),
      doctor({ id: 'hide', listing: 'hidden', verified: false }),
      doctor({ id: 'wait', listing: 'pending', verified: false }),
      doctor({ id: 'new', listing: 'unverified', verified: false }),
    ],
  }), NOW)
  assert.equal(doctors.value, '2')
  assert.match(doctors.detail, /1 hidden, 1 pending, 1 not verified/)
  assert.match(doctors.delta, /1 created this week and live now/)
  assert.equal(doctors.href, '/admin/people?filter=live')
})

test('stripe failure stays unavailable and past due is only an alert when Stripe answered', async () => {
  const { moneyKpis, moneyAlerts } = await import('./pulse.ts')
  const down = {
    stripeOk: false,
    paying: null,
    payingCustomers: null,
    studentMemberships: 0,
    pastDue: null,
    pastDueUsd: null,
    mrrUsd: null,
    disputesOpen: null,
    disputeAmount: null,
  }
  const cards = moneyKpis(down, 3, true)
  assert.equal(cards[0].value, 'Unavailable')
  assert.equal(cards[1].value, 'Unavailable')
  assert.match(cards[0].detail, /not zero/)
  assert.equal(cards[0].secondaryHref, '/admin/people?filter=unpaid')
  assert.equal(moneyAlerts(down).length, 0)
  const up = { ...down, stripeOk: true, paying: 4, payingCustomers: 4, pastDue: 2, pastDueUsd: 198, mrrUsd: 396, disputesOpen: 1, disputeAmount: '$50' }
  assert.equal(moneyKpis(up, 1, false)[1].value, '$396')
  assert.match(moneyKpis(up, 1, false)[1].delta, /not stored|No saved total/)
  assert.equal(moneyAlerts(up).length, 2)
  assert.equal(moneyAlerts(up)[0].href, '/admin/money')
})

test('who is here counts patient accounts and confirmed subscribers', async () => {
  const { whoCounts, DASH } = await import('./pulse.ts')
  const rows = whoCounts(roster({
    doctors: [doctor({ verified: true }), doctor({ id: 'h', verified: false, listing: 'hidden' })],
    people: [
      { id: 'p', name: 'Ada', email: 'a@example.com', role: 'patient', lastSignIn: null, createdAt: null, test: false },
      { id: 's', name: 'Bea', email: 'b@example.com', role: 'student', lastSignIn: null, createdAt: null, test: false },
    ],
    subscribers: [
      { id: 'c', email: 'c@example.com', status: 'confirmed', state: '', country: 'US', lat: null, lng: null, confirmed: true, sms: false, smsPhone: null },
      { id: 'u', email: 'u@example.com', status: 'pending', state: '', country: 'US', lat: null, lng: null, confirmed: false, sms: false, smsPhone: null },
    ],
  }))
  assert.equal(rows[1].label, 'patient accounts')
  assert.equal(rows[1].value, '1')
  assert.equal(rows[2].value, '1')
  assert.equal(rows[3].value, '1')
  assert.equal(DASH.test(JSON.stringify(rows)), false)
})
