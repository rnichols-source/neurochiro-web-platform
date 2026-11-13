import { planLeadTexts } from './plan.ts'
import { last4 } from './phone.ts'
import { quoSend, type QuoResult } from './quo-client.ts'
import type { DoctorAlertTarget, PatientAlertTarget, PlannedText, SmsRuntime, SmsStore } from './types.ts'

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

const HOLD_MS = 24 * 60 * 60 * 1000
const RELEASE_GAP_MS = 150
const RELEASE_LIMIT = 50

let warnedMissing = false

function warnMissing(): void {
  if (warnedMissing) return
  warnedMissing = true
  console.warn('[SMS] text tables are not ready. Apply supabase/migrations/proposed/20261108000000_instant_lead_texts.sql')
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function notify(store: SmsStore, plan: PlannedText, status: string, messageId: string | null, error: string | null): Promise<void> {
  if (!plan.contactRequestId) return
  const wrote = await store.notify({
    contact_request_id: plan.contactRequestId,
    kind: plan.kind,
    recipient: last4(plan.realPhone) || 'none',
    status,
    provider_message_id: messageId,
    error,
  })
  if (wrote.missing) warnMissing()
}

async function sendOne(input: {
  plan: PlannedText
  id: string
  store: SmsStore
  runtime: SmsRuntime
  fetchImpl?: FetchLike
  sleep: (ms: number) => Promise<void>
  timeoutMs?: number
  onlyStatus: string
}): Promise<'sent' | 'failed' | 'lost'> {
  const claimed = await input.store.mark(input.id, { status: 'sending', attempt: 1 }, input.onlyStatus)
  if (!claimed) return 'lost'
  let result: QuoResult
  try {
    result = await quoSend({
      to: input.plan.toPhone,
      content: input.plan.body,
      apiKey: input.runtime.apiKey,
      from: input.runtime.from,
      base: input.runtime.base,
      fetchImpl: input.fetchImpl,
      sleep: input.sleep,
      timeoutMs: input.timeoutMs,
    })
  } catch {
    result = { ok: false, status: 0, code: 'throw', messageId: null, retryable: false, attempts: 1 }
  }
  const status = result.ok ? 'sent' : 'failed'
  const error = result.ok ? null : (result.code || 'send_failed').slice(0, 80)
  await input.store.mark(input.id, {
    status,
    attempt: result.attempts,
    quo_message_id: result.messageId,
    sent_at: result.ok ? new Date().toISOString() : null,
    error,
  })
  await notify(input.store, input.plan, status, result.messageId, error)
  return status
}

async function deliverPlanned(input: {
  plans: PlannedText[]
  store: SmsStore
  runtime: SmsRuntime
  now: Date
  fetchImpl?: FetchLike
  sleep: (ms: number) => Promise<void>
  timeoutMs?: number
}): Promise<void> {
  for (const plan of input.plans) {
    const inserted = await input.store.insertLog({
      dedupe_key: plan.dedupeKey,
      kind: plan.kind,
      audience: plan.audience,
      contact_request_id: plan.contactRequestId,
      doctor_id: plan.doctorId,
      to_phone: plan.toPhone,
      body: plan.body,
      status: plan.status,
      send_after: plan.sendAfter,
      attempt: 0,
      test_mode: plan.testMode,
      created_at: input.now.toISOString(),
      error: plan.error,
    })
    if (inserted.missing) {
      warnMissing()
      return
    }
    if (inserted.duplicate || !inserted.id) continue
    if (plan.status !== 'queued') {
      await notify(input.store, plan, plan.status, null, plan.error)
      continue
    }
    await sendOne({
      plan,
      id: inserted.id,
      store: input.store,
      runtime: input.runtime,
      fetchImpl: input.fetchImpl,
      sleep: input.sleep,
      timeoutMs: input.timeoutMs,
      onlyStatus: 'queued',
    })
  }
}

export async function sendLeadTexts(input: {
  requestId: string
  doctor: DoctorAlertTarget
  patient: PatientAlertTarget
  smsConsentSaved: boolean
  store: SmsStore
  runtime: SmsRuntime
  now?: Date
  fetchImpl?: FetchLike
  sleep?: (ms: number) => Promise<void>
  timeoutMs?: number
  officeBody?: string | null
}): Promise<void> {
  try {
    const now = input.now ?? new Date()
    const plans = planLeadTexts({
      requestId: input.requestId,
      smsConsentSaved: input.smsConsentSaved,
      doctor: input.doctor,
      patient: input.patient,
      now,
      runtime: input.runtime,
      officeBody: input.officeBody,
    })
    await deliverPlanned({
      plans,
      store: input.store,
      runtime: input.runtime,
      now,
      fetchImpl: input.fetchImpl,
      sleep: input.sleep ?? defaultSleep,
      timeoutMs: input.timeoutMs,
    })
  } catch {
    console.warn('[SMS] lead texts stopped')
  }
}

export async function releaseHeld(input: {
  store: SmsStore
  runtime: SmsRuntime
  now?: Date
  fetchImpl?: FetchLike
  sleep?: (ms: number) => Promise<void>
  timeoutMs?: number
}): Promise<{ released: number; canceled: number; failed: number }> {
  const empty = { released: 0, canceled: 0, failed: 0 }
  try {
    if (!input.runtime.enabled) return empty
    const now = input.now ?? new Date()
    const sleep = input.sleep ?? defaultSleep
    const due = await input.store.dueHeld(now.toISOString(), RELEASE_LIMIT)
    if (due.missing) {
      warnMissing()
      return empty
    }
    let released = 0
    let canceled = 0
    let failed = 0
    for (const row of due.rows) {
      const created = Date.parse(row.created_at)
      const tooOld = Number.isFinite(created) && now.getTime() - created > HOLD_MS
      const plan: PlannedText = {
        dedupeKey: row.dedupe_key,
        kind: row.kind === 'doctor_new_lead' ? 'doctor_new_lead' : 'patient_request_confirm',
        audience: row.audience === 'doctor' ? 'doctor' : 'patient',
        requestId: row.contact_request_id || '',
        contactRequestId: row.contact_request_id,
        doctorId: row.doctor_id,
        realPhone: row.to_phone,
        toPhone: row.to_phone,
        body: row.body,
        status: 'held_quiet_hours',
        sendAfter: row.send_after,
        testMode: row.test_mode,
        error: null,
      }
      if (tooOld) {
        const marked = await input.store.mark(row.id, { status: 'canceled', error: 'held_too_long' }, 'held_quiet_hours')
        if (marked) {
          canceled += 1
          await notify(input.store, plan, 'canceled', null, 'held_too_long')
        }
        continue
      }
      const outcome = await sendOne({
        plan,
        id: row.id,
        store: input.store,
        runtime: input.runtime,
        fetchImpl: input.fetchImpl,
        sleep,
        timeoutMs: input.timeoutMs,
        onlyStatus: 'held_quiet_hours',
      })
      if (outcome === 'sent') released += 1
      if (outcome === 'failed') failed += 1
      await sleep(RELEASE_GAP_MS)
    }
    return { released, canceled, failed }
  } catch {
    console.warn('[SMS] held texts were not released')
    return empty
  }
}
