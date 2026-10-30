import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_LEAD_FOLLOWUP } from './config.ts'
import { nextLeadAction, type LeadNotificationSnapshot, type LeadRequestSnapshot } from './escalation.ts'

const created = new Date('2026-10-30T12:00:00Z')

function request(hours: number, extra: Partial<LeadRequestSnapshot> = {}): LeadRequestSnapshot {
  return {
    id: 'lead-1',
    status: 'new',
    contact_outcome: null,
    created_at: new Date(created.getTime() - hours * 3_600_000).toISOString(),
    reminder_count: 0,
    patient_email: 'patient@example.com',
    escalated_to_admin_at: null,
    patient_checkin_sent_at: null,
    patient_checkin_response: null,
    acknowledged_at: null,
    outcome_detail: null,
    will_call_deadline: null,
    withdrawn_at: null,
    ...extra,
  }
}

function atAge(hours: number) {
  return created
}

function act(hours: number, extra: Partial<LeadRequestSnapshot> = {}, notes: LeadNotificationSnapshot[] = [], quiet = false) {
  return nextLeadAction(request(hours, extra), notes, DEFAULT_LEAD_FOLLOWUP, atAge(hours), { inQuietHours: quiet })
}

test('0h does nothing', () => {
  assert.deepEqual(act(0), { type: 'none', reason: 'not_due' })
})

test('2h sends the first reminder', () => {
  assert.deepEqual(act(2), { type: 'doctor_reminder_1' })
})

test('2h during quiet hours waits', () => {
  assert.deepEqual(act(2, {}, [], true), { type: 'none', reason: 'quiet_hours' })
})

test('24h with no reminder yet still sends reminder 1, not reminder 2', () => {
  assert.deepEqual(act(24), { type: 'doctor_reminder_1' })
})

test('24h after reminder 1 sends reminder 2', () => {
  assert.deepEqual(act(24, { reminder_count: 1 }), { type: 'doctor_reminder_2' })
})

test('reminder 2 waits for quiet hours', () => {
  assert.deepEqual(act(24, { reminder_count: 1 }, [], true), { type: 'none', reason: 'quiet_hours' })
})

test('48h after both reminders escalates even during quiet hours', () => {
  assert.deepEqual(act(48, { reminder_count: 2 }, [], true), { type: 'admin_escalation' })
})

test('72h after escalation sends the patient check-in', () => {
  assert.deepEqual(act(72, { reminder_count: 2, escalated_to_admin_at: created.toISOString() }), { type: 'patient_checkin' })
})

test('72h without a patient email does not invent a check-in', () => {
  assert.deepEqual(
    act(72, { reminder_count: 2, escalated_to_admin_at: created.toISOString(), patient_email: null }),
    { type: 'none', reason: 'no_patient_email' },
  )
})

test('withdrawn leads are finished', () => {
  assert.deepEqual(act(72, { status: 'withdrawn' }), { type: 'none', reason: 'withdrawn' })
})

test('a confirmed lead before the check-in window is finished', () => {
  assert.deepEqual(act(10, {
    status: 'acknowledged',
    contact_outcome: 'patient_contacted_confirmed',
    acknowledged_at: new Date(created.getTime() - 60 * 60 * 1000).toISOString(),
    outcome_detail: 'called',
  }), { type: 'none', reason: 'acknowledged' })
})

test('24h after a called acknowledgement asks the patient', () => {
  assert.deepEqual(act(26, {
    status: 'acknowledged',
    contact_outcome: 'patient_contacted_confirmed',
    outcome_detail: 'called',
    acknowledged_at: new Date(created.getTime() - 25 * 3_600_000).toISOString(),
  }), { type: 'patient_checkin' })
})

test('will_call_today waits until the deadline', () => {
  assert.deepEqual(act(30, {
    contact_outcome: 'will_call_today',
    will_call_deadline: new Date(created.getTime() + 3_600_000).toISOString(),
  }), { type: 'none', reason: 'will_call_today' })
})

test('a passed will_call deadline resumes at the next unsent reminder', () => {
  assert.deepEqual(act(30, {
    contact_outcome: 'will_call_today',
    will_call_deadline: new Date(created.getTime() - 3_600_000).toISOString(),
  }), { type: 'doctor_reminder_1' })
})

test('a failed initial email is retried before any reminder', () => {
  const notes: LeadNotificationSnapshot[] = [{ id: 'n1', kind: 'doctor_initial', status: 'failed', attempt: 2 }]
  assert.deepEqual(act(0, {}, notes), { type: 'retry', notificationId: 'n1', kind: 'doctor_initial' })
})

test('a failed initial email stops retrying after 5 attempts', () => {
  const notes: LeadNotificationSnapshot[] = [{ id: 'n1', kind: 'doctor_initial', status: 'failed', attempt: 5 }]
  assert.deepEqual(act(0, {}, notes), { type: 'none', reason: 'not_due' })
})

test('a sent reminder is not sent again when the counter was not saved', () => {
  const notes: LeadNotificationSnapshot[] = [{ id: 'n1', kind: 'doctor_reminder_1', status: 'sent', attempt: 1 }]
  assert.deepEqual(act(24, { reminder_count: 0 }, notes), { type: 'doctor_reminder_2' })
})
