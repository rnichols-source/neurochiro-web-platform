'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { loadDoctorSnapshot, searchDoctorsForStarts, startsTable } from '@/lib/founder/patient-starts'
import { parseMoneyInput, parsePatientsStarted, parseReportedOn } from '@/lib/founder/patient-starts-calc'

export type StartsActionResult = { ok: true } | { ok: false; error: string }

export async function searchStartsDoctorsAction(query: string): Promise<{ id: string; slug: string; name: string; clinicName: string | null; city: string | null; state: string | null }[]> {
  try {
    return await searchDoctorsForStarts(query)
  } catch (err) {
    console.error('admin patient starts search', err instanceof Error ? err.name : 'error')
    return []
  }
}

function formValue(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

function checked(form: FormData, key: string): boolean {
  const value = form.get(key)
  return value === 'on' || value === 'true' || value === '1'
}

async function persistStart(input: {
  id?: string
  doctorId: string
  patientsStarted: number
  reportedOn: string
  notes: string | null
  carePlanValueUsd: number | null
  valueIsEstimate: boolean
  valueSource: string | null
}): Promise<StartsActionResult> {
  await checkAdminAuth()
  const doctor = await loadDoctorSnapshot(input.doctorId)
  if (!doctor) return { ok: false, error: 'That doctor was not found.' }
  const admin = createAdminClient()
  const table = startsTable(admin)
  const fields = {
    doctor_id: doctor.id,
    doctor_slug: doctor.slug,
    doctor_name: doctor.name,
    clinic_name: doctor.clinicName,
    city: doctor.city,
    state: doctor.state,
    patients_started: input.patientsStarted,
    reported_on: input.reportedOn,
    notes: input.notes,
    care_plan_value_usd: input.carePlanValueUsd,
    value_is_estimate: input.carePlanValueUsd == null ? true : input.valueIsEstimate,
    value_source: input.valueSource,
    updated_at: new Date().toISOString(),
  }
  const result = input.id
    ? await table.update(fields).eq('id', input.id)
    : await (table as unknown as { insert: (values: Record<string, unknown>) => Promise<{ error: { message: string; code?: string } | null }> }).insert(fields)
  if (result.error) {
    if (result.error.code === '23505') {
      return { ok: false, error: 'A report for this doctor on that date already exists. Edit the existing row instead.' }
    }
    console.error('admin patient starts save', result.error.code || 'error')
    return { ok: false, error: 'The report could not be saved.' }
  }
  revalidatePath('/admin/starts')
  revalidatePath('/admin')
  revalidatePath('/admin/members')
  return { ok: true }
}

type ParsedFields = {
  ok: true
  patientsStarted: number
  reportedOn: string
  notes: string | null
  carePlanValueUsd: number | null
  valueIsEstimate: boolean
  valueSource: string | null
} | { ok: false; error: string }

function parsedFields(form: FormData): ParsedFields {
  const patientsStarted = parsePatientsStarted(formValue(form, 'patients_started'))
  const reportedOn = parseReportedOn(formValue(form, 'reported_on'))
  const careRaw = formValue(form, 'care_plan_value_usd')
  const carePlanValueUsd = careRaw.trim() ? parseMoneyInput(careRaw) : null
  if (patientsStarted == null) return { ok: false, error: 'Enter how many patients started care.' }
  if (!reportedOn) return { ok: false, error: 'Enter a valid report date.' }
  if (careRaw.trim() && carePlanValueUsd == null) return { ok: false, error: 'Care plan value has to be a number, or left blank.' }
  return {
    ok: true,
    patientsStarted,
    reportedOn,
    notes: formValue(form, 'notes').trim() || null,
    carePlanValueUsd,
    valueIsEstimate: checked(form, 'value_is_estimate'),
    valueSource: formValue(form, 'value_source').trim() || null,
  }
}

export async function addPatientStartAction(form: FormData): Promise<StartsActionResult> {
  try {
    const doctorId = formValue(form, 'doctor_id')
    if (!doctorId) return { ok: false, error: 'Pick a doctor first.' }
    const fields = parsedFields(form)
    if (!fields.ok) return { ok: false, error: fields.error }
    return await persistStart({ doctorId, ...fields })
  } catch (err) {
    console.error('admin patient starts add', err instanceof Error ? err.name : 'error')
    return { ok: false, error: 'The report could not be saved.' }
  }
}

export async function updatePatientStartAction(form: FormData): Promise<StartsActionResult> {
  try {
    const id = formValue(form, 'id')
    const doctorId = formValue(form, 'doctor_id')
    if (!id || !doctorId) return { ok: false, error: 'This report could not be updated.' }
    const fields = parsedFields(form)
    if (!fields.ok) return { ok: false, error: fields.error }
    return await persistStart({ id, doctorId, ...fields })
  } catch (err) {
    console.error('admin patient starts update', err instanceof Error ? err.name : 'error')
    return { ok: false, error: 'The report could not be saved.' }
  }
}
