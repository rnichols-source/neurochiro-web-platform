import assert from 'node:assert/strict'
import test from 'node:test'
import {
  historyForRequest,
  legacyLeadStage,
  monthlyStageCounts,
  nextStage,
  stageFromLegacy,
  stageLabel,
  visibleRequestContact,
} from './pipeline.ts'

test('stages move one step and close reasons do not advance', () => {
  assert.equal(nextStage('requested'), 'contacted')
  assert.equal(nextStage('contacted'), 'scheduled')
  assert.equal(nextStage('scheduled'), 'started_care')
  assert.equal(nextStage('started_care'), null)
  assert.equal(nextStage('no_answer'), null)
  assert.equal(stageLabel('started_care'), 'Started care')
  assert.equal(stageLabel('not_a_fit'), 'Not a fit')
})

test('older lead and visit statuses map onto the pipeline', () => {
  assert.equal(stageFromLegacy('new'), 'requested')
  assert.equal(stageFromLegacy('seen'), 'contacted')
  assert.equal(stageFromLegacy('converted'), 'started_care')
  assert.equal(legacyLeadStage('started_care'), 'converted')
  assert.equal(legacyLeadStage('no_answer'), null)
})

test('dated history prefers saved events and otherwise rebuilds from the current stage', () => {
  const saved = historyForRequest({
    createdAt: '2026-11-01T15:00:00.000Z',
    stage: 'scheduled',
    events: [
      { stage: 'requested', at: '2026-11-01T15:00:00.000Z' },
      { stage: 'scheduled', at: '2026-11-03T15:00:00.000Z' },
    ],
  })
  assert.equal(saved.length, 2)
  assert.equal(saved[1].stage, 'scheduled')
  const rebuilt = historyForRequest({
    createdAt: '2026-11-01T15:00:00.000Z',
    stage: 'contacted',
    contactedAt: '2026-11-02T15:00:00.000Z',
  })
  assert.deepEqual(rebuilt.map((row) => row.stage), ['requested', 'contacted'])
})

test('only the requested doctor sees shared contact, and a referral phone stays hidden until accept', () => {
  assert.deepEqual(visibleRequestContact({
    kind: 'visit',
    doctorId: 'doc',
    ownerDoctorId: 'doc',
    email: 'ada@example.com',
    phone: '555',
  }), { email: 'ada@example.com', phone: '555' })
  assert.deepEqual(visibleRequestContact({
    kind: 'visit',
    doctorId: 'other',
    ownerDoctorId: 'doc',
    email: 'ada@example.com',
    phone: '555',
  }), { email: null, phone: null })
  assert.deepEqual(visibleRequestContact({
    kind: 'referral',
    doctorId: 'doc',
    ownerDoctorId: 'doc',
    email: 'ada@example.com',
    phone: '555',
    referralStatus: 'sent',
  }), { email: null, phone: null })
  assert.equal(visibleRequestContact({
    kind: 'referral',
    doctorId: 'doc',
    ownerDoctorId: 'doc',
    email: null,
    phone: '555',
    referralStatus: 'accepted',
  }).phone, '555')
})

test('monthly ROI counts scheduled and started care events', () => {
  const rows = monthlyStageCounts([
    { doctorId: 'a', stage: 'scheduled', at: '2026-11-02T00:00:00.000Z' },
    { doctorId: 'a', stage: 'started_care', at: '2026-11-20T00:00:00.000Z' },
    { doctorId: 'a', stage: 'contacted', at: '2026-11-01T00:00:00.000Z' },
    { doctorId: 'b', stage: 'scheduled', at: '2026-12-01T00:00:00.000Z' },
  ])
  assert.equal(rows.find((row) => row.doctorId === 'a')?.scheduled, 1)
  assert.equal(rows.find((row) => row.doctorId === 'a')?.startedCare, 1)
  assert.equal(rows.find((row) => row.doctorId === 'b')?.monthStart, '2026-12-01')
})
