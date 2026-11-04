import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getLocalHour } from '../doctor-timezone.ts'
import { sendLeadTexts, releaseHeld } from './engine.ts'
import { planLeadTexts } from './plan.ts'
import type { DoctorAlertTarget, PatientAlertTarget, SmsInsert, SmsLogRow, SmsNotify, SmsRuntime, SmsStore } from './types.ts'

const day = new Date('2026-11-03T17:00:00.000Z')
const night = new Date('2026-11-03T03:00:00.000Z')

const doctor: DoctorAlertTarget = {
  id: 'doc-1',
  state: 'SC',
  country: 'US',
  lastName: 'Adams',
  practice: 'Harbor Family',
  leadAlertPhones: ['+18645550199'],
  smsAlertsEnabled: true,
  smsAlertsConsentAt: '2026-11-01T00:00:00.000Z',
}

const patient: PatientAlertTarget = {
  name: 'Jamie Lee',
  phone: '864-555-0100',
  email: 'jamie@example.com',
  smsPhone: '+18645550100',
  bestTime: 'Mornings',
  message: 'Please call after 9',
}

function runtime(patch: Partial<SmsRuntime> = {}): SmsRuntime {
  return {
    enabled: true,
    apiKey: 'test-key',
    from: '+15550000000',
    base: 'https://api.quo.com',
    testPhone: null,
    testRedirect: false,
    ...patch,
  }
}

function memoryStore(): SmsStore & { logs: Array<SmsInsert & { id: string }>; notes: SmsNotify[] } {
  const logs: Array<SmsInsert & { id: string }> = []
  const notes: SmsNotify[] = []
  return {
    logs,
    notes,
    async insertLog(row) {
      if (logs.some((item) => item.dedupe_key === row.dedupe_key)) {
        return { id: null, duplicate: true, missing: false }
      }
      const id = `log-${logs.length + 1}`
      logs.push({ ...row, id })
      return { id, duplicate: false, missing: false }
    },
    async mark(id, patch, onlyStatus) {
      const row = logs.find((item) => item.id === id)
      if (!row) return false
      if (onlyStatus && row.status !== onlyStatus) return false
      Object.assign(row, patch)
      return true
    },
    async notify(row) {
      notes.push(row)
      return { missing: false }
    },
    async dueHeld(nowIso, limit) {
      const rows: SmsLogRow[] = logs
        .filter((row) => row.status === 'held_quiet_hours' && row.send_after <= nowIso)
        .sort((a, b) => a.send_after.localeCompare(b.send_after))
        .slice(0, limit)
        .map((row) => ({
          id: row.id,
          dedupe_key: row.dedupe_key,
          kind: row.kind,
          audience: row.audience,
          contact_request_id: row.contact_request_id,
          doctor_id: row.doctor_id,
          to_phone: row.to_phone,
          body: row.body,
          status: row.status,
          send_after: row.send_after,
          attempt: row.attempt,
          test_mode: row.test_mode,
          created_at: row.created_at,
        }))
      return { missing: false, rows }
    },
  }
}

function recorder(handler: (call: number, init: RequestInit) => Promise<Response> | Response) {
  const calls: { url: string; to: string; authorization: string }[] = []
  const impl = async (url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || '{}')) as { to?: string[] }
    const authorization = new Headers(init?.headers).get('authorization') || ''
    calls.push({ url: String(url), to: body.to?.[0] || '', authorization })
    return handler(calls.length, init || {})
  }
  return { impl, calls }
}

function okFetch() {
  return recorder(() => new Response(JSON.stringify({ data: { id: 'AC123', status: 'queued' } }), { status: 202 }))
}

test('planLeadTexts is pure and SMS_ENABLED off writes skipped rows without fetch', async () => {
  const plans = planLeadTexts({
    requestId: 'req-1',
    smsConsentSaved: true,
    doctor,
    patient,
    now: day,
    runtime: runtime({ enabled: false }),
  })
  assert.equal(plans.length, 2)
  assert.ok(plans.every((plan) => plan.status === 'skipped_disabled'))

  const store = memoryStore()
  const fetchMock = recorder(() => {
    throw new Error('fetch should not run')
  })
  await sendLeadTexts({
    requestId: 'req-1',
    doctor,
    patient,
    smsConsentSaved: true,
    store,
    runtime: runtime({ enabled: false }),
    now: day,
    fetchImpl: fetchMock.impl,
  })
  assert.equal(fetchMock.calls.length, 0)
  assert.equal(store.logs.length, 2)
  assert.ok(store.logs.every((row) => row.status === 'skipped_disabled'))
})

test('no consent does not create a patient text', async () => {
  const store = memoryStore()
  const fetchMock = okFetch()
  await sendLeadTexts({
    requestId: 'req-2',
    doctor,
    patient,
    smsConsentSaved: false,
    store,
    runtime: runtime(),
    now: day,
    fetchImpl: fetchMock.impl,
  })
  assert.equal(store.logs.some((row) => row.audience === 'patient'), false)
  assert.equal(store.logs.filter((row) => row.audience === 'doctor').length, 1)
  assert.deepEqual(fetchMock.calls.map((call) => call.to), ['+18645550199'])
})

test('the same request is sent once per recipient', async () => {
  const store = memoryStore()
  const fetchMock = okFetch()
  const input = {
    requestId: 'req-3',
    doctor,
    patient,
    smsConsentSaved: true,
    store,
    runtime: runtime(),
    now: day,
    fetchImpl: fetchMock.impl,
  }
  await sendLeadTexts(input)
  await sendLeadTexts(input)
  assert.equal(store.logs.length, 2)
  assert.equal(fetchMock.calls.length, 2)
  assert.deepEqual(fetchMock.calls.map((call) => call.to).sort(), ['+18645550100', '+18645550199'])
  assert.ok(fetchMock.calls.every((call) => call.authorization === 'test-key'))
  assert.ok(fetchMock.calls.every((call) => call.url === 'https://api.quo.com/v1/messages'))
  assert.ok(store.notes.every((note) => note.recipient === '0100' || note.recipient === '0199'))
})

test('doctor texts wait during quiet hours and the patient text does not', async () => {
  const store = memoryStore()
  const fetchMock = okFetch()
  await sendLeadTexts({
    requestId: 'req-4',
    doctor,
    patient,
    smsConsentSaved: true,
    store,
    runtime: runtime(),
    now: night,
    fetchImpl: fetchMock.impl,
  })
  const patientRow = store.logs.find((row) => row.audience === 'patient')
  const doctorRow = store.logs.find((row) => row.audience === 'doctor')
  assert.equal(patientRow?.status, 'sent')
  assert.equal(doctorRow?.status, 'held_quiet_hours')
  assert.equal(fetchMock.calls.length, 1)
  assert.equal(fetchMock.calls[0].to, '+18645550100')
  assert.equal(getLocalHour('America/New_York', new Date(doctorRow?.send_after || '')), 8)

  const later = new Date(doctorRow?.send_after || night)
  const releaseFetch = okFetch()
  const released = await releaseHeld({
    store,
    runtime: runtime(),
    now: new Date(later.getTime() + 60_000),
    fetchImpl: releaseFetch.impl,
    sleep: async () => {},
  })
  assert.equal(released.released, 1)
  assert.equal(releaseFetch.calls.length, 1)
  assert.equal(doctorRow?.status, 'sent')
})

test('SMS_TEST_PHONE redirects every destination', async () => {
  const store = memoryStore()
  const fetchMock = okFetch()
  await sendLeadTexts({
    requestId: 'req-5',
    doctor,
    patient,
    smsConsentSaved: true,
    store,
    runtime: runtime({ testPhone: '+15550001111', testRedirect: true }),
    now: day,
    fetchImpl: fetchMock.impl,
  })
  assert.deepEqual(fetchMock.calls.map((call) => call.to), ['+15550001111', '+15550001111'])
  assert.ok(store.logs.every((row) => row.test_mode === true))
  assert.ok(store.logs.some((row) => row.body.startsWith('[TEST for ...0100] ')))
  assert.ok(store.logs.some((row) => row.body.startsWith('[TEST for ...0199] ')))
})

test('a Quo 500 or a timeout does not throw', async () => {
  const serverError = memoryStore()
  const failedFetch = recorder(() => new Response(JSON.stringify({ code: '0500' }), { status: 500 }))
  await assert.doesNotReject(() => sendLeadTexts({
    requestId: 'req-6',
    doctor: { ...doctor, leadAlertPhones: [], smsAlertsEnabled: false, smsAlertsConsentAt: null },
    patient,
    smsConsentSaved: true,
    store: serverError,
    runtime: runtime(),
    now: day,
    fetchImpl: failedFetch.impl,
    sleep: async () => {},
  }))
  assert.equal(failedFetch.calls.length, 2)
  assert.equal(serverError.logs[0]?.status, 'failed')

  const timedOut = memoryStore()
  const hanging = recorder((_call, init) => new Promise((_resolve, reject) => {
    const fail = () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      reject(err)
    }
    if (init.signal?.aborted) fail()
    init.signal?.addEventListener('abort', fail, { once: true })
  }))
  await assert.doesNotReject(() => sendLeadTexts({
    requestId: 'req-7',
    doctor: { ...doctor, leadAlertPhones: [], smsAlertsEnabled: false, smsAlertsConsentAt: null },
    patient,
    smsConsentSaved: true,
    store: timedOut,
    runtime: runtime(),
    now: day,
    fetchImpl: hanging.impl,
    timeoutMs: 20,
  }))
  assert.equal(timedOut.logs[0]?.status, 'failed')
  assert.equal(hanging.calls.length, 1)
})

test('held rows older than 24 hours are canceled instead of sent', async () => {
  const store = memoryStore()
  await sendLeadTexts({
    requestId: 'req-8',
    doctor,
    patient: { ...patient, smsPhone: null },
    smsConsentSaved: false,
    store,
    runtime: runtime(),
    now: night,
    fetchImpl: recorder(() => { throw new Error('no fetch') }).impl,
  })
  const held = store.logs.find((row) => row.status === 'held_quiet_hours')
  assert.ok(held)
  const fetchMock = okFetch()
  const result = await releaseHeld({
    store,
    runtime: runtime(),
    now: new Date(night.getTime() + 25 * 60 * 60 * 1000),
    fetchImpl: fetchMock.impl,
    sleep: async () => {},
  })
  assert.equal(fetchMock.calls.length, 0)
  assert.equal(result.canceled, 1)
  assert.equal(held?.status, 'canceled')
})
