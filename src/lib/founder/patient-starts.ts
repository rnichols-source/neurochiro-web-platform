import 'server-only'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { looseFrom } from '@/lib/admin/loose-query'
import { stripe } from '@/lib/stripe'
import { loadMrrBaselineInputs } from '@/lib/founder/mrr'
import {
  annualizeMembershipUsd,
  numericOrNull,
  sumRevenue,
} from '@/lib/founder/patient-starts-calc'

export type PatientStartRow = {
  id: string
  doctorId: string
  doctorSlug: string
  doctorName: string
  clinicName: string | null
  city: string | null
  state: string | null
  patientsStarted: number
  reportedOn: string
  notes: string | null
  carePlanValueUsd: number | null
  valueIsEstimate: boolean
  valueSource: string | null
  estRevenueUsd: number | null
}

export type MembershipCost = {
  annualUsd: number | null
  amountLabel: string | null
  reason: 'no_customer' | 'no_amount' | 'stripe_unavailable' | null
}

export type DoctorStartGroup = {
  doctorId: string
  doctorSlug: string
  doctorName: string
  clinicName: string | null
  city: string | null
  state: string | null
  patientsStarted: number
  estRevenueUsd: number | null
  valueIsEstimate: boolean
  officialIntroCount: number | null
  membership: MembershipCost
  reports: PatientStartRow[]
}

export type StartsTotals = {
  doctorCount: number
  totalPatientsStarted: number
  totalEstRevenueUsd: number | null
}

export type StartsDashboard = {
  totals: StartsTotals
  doctors: DoctorStartGroup[]
}

export type DoctorStartOption = {
  id: string
  slug: string
  name: string
  clinicName: string | null
  city: string | null
  state: string | null
}

type LooseClient = ReturnType<typeof createAdminClient>

const START_COLUMNS = 'id, doctor_id, doctor_slug, doctor_name, clinic_name, city, state, patients_started, reported_on, notes, care_plan_value_usd, value_is_estimate, value_source, est_revenue_usd'
const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due'])

function textOrNull(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text ? text : null
}

function textOrEmpty(value: unknown): string {
  return textOrNull(value) || ''
}

function boolOr(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value
  if (value == null) return fallback
  return Boolean(value)
}

export function mapStartRow(row: Record<string, unknown>): PatientStartRow | null {
  const id = textOrNull(row.id)
  const doctorId = textOrNull(row.doctor_id)
  const patientsStarted = numericOrNull(row.patients_started)
  const reportedOn = textOrNull(row.reported_on)
  if (!id || !doctorId || patientsStarted == null || !reportedOn) return null
  return {
    id,
    doctorId,
    doctorSlug: textOrEmpty(row.doctor_slug),
    doctorName: textOrEmpty(row.doctor_name) || 'Unnamed doctor',
    clinicName: textOrNull(row.clinic_name),
    city: textOrNull(row.city),
    state: textOrNull(row.state),
    patientsStarted,
    reportedOn: reportedOn.slice(0, 10),
    notes: textOrNull(row.notes),
    carePlanValueUsd: numericOrNull(row.care_plan_value_usd),
    valueIsEstimate: boolOr(row.value_is_estimate, true),
    valueSource: textOrNull(row.value_source),
    estRevenueUsd: numericOrNull(row.est_revenue_usd),
  }
}

export async function listPatientStartRows(admin: LooseClient, doctorId?: string): Promise<PatientStartRow[]> {
  let query = looseFrom(admin, 'patient_starts').select(START_COLUMNS).order('reported_on', { ascending: false }).range(0, 999)
  if (doctorId) query = query.eq('doctor_id', doctorId)
  const result = await query
  if (result.error) {
    console.error('admin patient starts list', result.error.code || 'error')
    return []
  }
  return (result.data || []).map((row) => mapStartRow(row)).filter((row): row is PatientStartRow => Boolean(row))
}

export async function loadStartsTotals(admin: LooseClient): Promise<StartsTotals> {
  const result = await looseFrom(admin, 'patient_starts_totals').select('doctor_count, total_patients_started, total_est_revenue_usd').range(0, 0)
  const row = result.data?.[0]
  if (result.error || !row) {
    if (result.error) console.error('admin patient starts totals', result.error.code || 'error')
    return { doctorCount: 0, totalPatientsStarted: 0, totalEstRevenueUsd: null }
  }
  return {
    doctorCount: numericOrNull(row.doctor_count) || 0,
    totalPatientsStarted: numericOrNull(row.total_patients_started) || 0,
    totalEstRevenueUsd: numericOrNull(row.total_est_revenue_usd),
  }
}

async function officialIntroCounts(admin: LooseClient, doctorIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (doctorIds.length === 0) return counts
  await Promise.all(doctorIds.map(async (id) => {
    const result = await looseFrom(admin, 'reply_logs')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', id)
      .eq('template_id', 'sent_to_patient')
    counts.set(id, result.error ? -1 : result.count || 0)
  }))
  return counts
}

async function customerIdsForDoctors(admin: LooseClient, doctorIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  if (doctorIds.length === 0) return map
  const doctors = await looseFrom(admin, 'doctors').select('id, user_id').in('id', doctorIds).range(0, doctorIds.length - 1)
  const userIds = (doctors.data || []).map((row) => textOrNull(row.user_id)).filter((id): id is string => Boolean(id))
  const profiles = new Map<string, string | null>()
  if (userIds.length) {
    const { data } = await admin.from('profiles').select('id, stripe_customer_id').in('id', userIds)
    for (const row of data || []) profiles.set(row.id, row.stripe_customer_id || null)
  }
  for (const row of doctors.data || []) {
    const id = textOrNull(row.id)
    if (!id) continue
    const userId = textOrNull(row.user_id)
    map.set(id, userId ? profiles.get(userId) || null : null)
  }
  return map
}

async function membershipCostForCustomer(customerId: string | null): Promise<MembershipCost> {
  if (!customerId) return { annualUsd: null, amountLabel: null, reason: 'no_customer' }
  try {
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
    const chosen = [...subscriptions.data].sort((left, right) => {
      const rank = (status: string) => {
        const index = ['active', 'trialing', 'past_due'].indexOf(status)
        return index === -1 ? 99 : index
      }
      return rank(left.status) - rank(right.status)
    })[0]
    if (!chosen || !LIVE_STATUSES.has(chosen.status)) {
      return { annualUsd: null, amountLabel: null, reason: 'no_amount' }
    }
    const item = chosen.items.data[0]
    const price = item?.price
    const unitAmount = price?.unit_amount
    const interval = price?.recurring?.interval
    const intervalCount = price?.recurring?.interval_count || 1
    const quantity = item?.quantity || 1
    const currency = price?.currency || 'usd'
    if (typeof unitAmount !== 'number' || !interval) {
      return { annualUsd: null, amountLabel: chosen.status, reason: 'no_amount' }
    }
    const { rates } = await loadMrrBaselineInputs()
    const annualUsd = annualizeMembershipUsd({
      unitAmount,
      quantity,
      interval,
      intervalCount,
      currency,
      rates,
    })
    if (annualUsd == null) return { annualUsd: null, amountLabel: null, reason: 'no_amount' }
    const major = currency.toUpperCase() === 'JPY' ? unitAmount : unitAmount / 100
    const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: major >= 100 ? 0 : 2 }).format(major)
    return {
      annualUsd,
      amountLabel: `${money}/${interval}`,
      reason: null,
    }
  } catch (err) {
    console.error('admin patient starts stripe', err instanceof Error ? err.name : 'error')
    return { annualUsd: null, amountLabel: null, reason: 'stripe_unavailable' }
  }
}

function groupRows(rows: PatientStartRow[], intros: Map<string, number>, costs: Map<string, MembershipCost>): DoctorStartGroup[] {
  const groups = new Map<string, DoctorStartGroup>()
  for (const row of rows) {
    const existing = groups.get(row.doctorId)
    if (!existing) {
      groups.set(row.doctorId, {
        doctorId: row.doctorId,
        doctorSlug: row.doctorSlug,
        doctorName: row.doctorName,
        clinicName: row.clinicName,
        city: row.city,
        state: row.state,
        patientsStarted: row.patientsStarted,
        estRevenueUsd: row.estRevenueUsd,
        valueIsEstimate: Boolean(row.carePlanValueUsd != null && row.valueIsEstimate),
        officialIntroCount: intros.has(row.doctorId) ? (intros.get(row.doctorId) === -1 ? null : intros.get(row.doctorId) || 0) : null,
        membership: costs.get(row.doctorId) || { annualUsd: null, amountLabel: null, reason: 'no_customer' },
        reports: [row],
      })
      continue
    }
    existing.patientsStarted += row.patientsStarted
    existing.estRevenueUsd = sumRevenue([existing.estRevenueUsd, row.estRevenueUsd])
    if (row.carePlanValueUsd != null && row.valueIsEstimate) existing.valueIsEstimate = true
    existing.reports.push(row)
  }
  return [...groups.values()].sort((a, b) => b.patientsStarted - a.patientsStarted || a.doctorName.localeCompare(b.doctorName))
}

export async function loadStartsDashboard(): Promise<StartsDashboard> {
  await checkAdminAuth()
  const admin = createAdminClient()
  const [rows, totals] = await Promise.all([listPatientStartRows(admin), loadStartsTotals(admin)])
  const doctorIds = [...new Set(rows.map((row) => row.doctorId))]
  const [intros, customers] = await Promise.all([officialIntroCounts(admin, doctorIds), customerIdsForDoctors(admin, doctorIds)])
  const costs = new Map<string, MembershipCost>()
  await Promise.all(doctorIds.map(async (id) => {
    costs.set(id, await membershipCostForCustomer(customers.get(id) || null))
  }))
  return { totals, doctors: groupRows(rows, intros, costs) }
}

export async function loadStartsForDoctor(doctorId: string): Promise<{
  reports: PatientStartRow[]
  patientsStarted: number
  estRevenueUsd: number | null
  valueIsEstimate: boolean
  officialIntroCount: number | null
  membership: MembershipCost
}> {
  await checkAdminAuth()
  const admin = createAdminClient()
  const [reports, intros, customers] = await Promise.all([
    listPatientStartRows(admin, doctorId),
    officialIntroCounts(admin, [doctorId]),
    customerIdsForDoctors(admin, [doctorId]),
  ])
  const intro = intros.get(doctorId)
  return {
    reports,
    patientsStarted: reports.reduce((sum, row) => sum + row.patientsStarted, 0),
    estRevenueUsd: sumRevenue(reports.map((row) => row.estRevenueUsd)),
    valueIsEstimate: reports.some((row) => row.carePlanValueUsd != null && row.valueIsEstimate),
    officialIntroCount: intro == null || intro < 0 ? null : intro,
    membership: await membershipCostForCustomer(customers.get(doctorId) || null),
  }
}

export async function searchDoctorsForStarts(query: string): Promise<DoctorStartOption[]> {
  await checkAdminAuth()
  const q = query.trim()
  if (q.length < 2) return []
  const admin = createAdminClient()
  const pattern = `%${q.replace(/[%_]/g, '')}%`
  const result = await looseFrom(admin, 'doctors')
    .select('id, slug, first_name, last_name, clinic_name, city, state')
    .or(`last_name.ilike.${pattern},first_name.ilike.${pattern},clinic_name.ilike.${pattern},city.ilike.${pattern}`)
    .order('last_name', { ascending: true })
    .range(0, 19) // intentional bound
  if (result.error) {
    console.error('admin patient starts doctor search', result.error.code || 'error')
    return []
  }
  return (result.data || []).map((row) => {
    const last = textOrEmpty(row.last_name)
    const first = textOrEmpty(row.first_name)
    const name = [first ? `Dr. ${first}` : 'Dr.', last].filter(Boolean).join(' ')
    return {
      id: textOrEmpty(row.id),
      slug: textOrEmpty(row.slug),
      name: name || 'Unnamed doctor',
      clinicName: textOrNull(row.clinic_name),
      city: textOrNull(row.city),
      state: textOrNull(row.state),
    }
  }).filter((row) => row.id)
}

export async function loadDoctorSnapshot(doctorId: string): Promise<DoctorStartOption | null> {
  const admin = createAdminClient()
  const result = await looseFrom(admin, 'doctors')
    .select('id, slug, first_name, last_name, clinic_name, city, state')
    .eq('id', doctorId)
    .range(0, 0)
  const row = result.data?.[0]
  if (result.error || !row) return null
  const last = textOrEmpty(row.last_name)
  const first = textOrEmpty(row.first_name)
  return {
    id: textOrEmpty(row.id),
    slug: textOrEmpty(row.slug),
    name: [first ? `Dr. ${first}` : 'Dr.', last].filter(Boolean).join(' ') || 'Unnamed doctor',
    clinicName: textOrNull(row.clinic_name),
    city: textOrNull(row.city),
    state: textOrNull(row.state),
  }
}

export function startsTable(admin: LooseClient) {
  return (admin as unknown as { from: (name: string) => StartsTable }).from('patient_starts')
}

type StartsTable = {
  insert: (values: Record<string, unknown>) => Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }>
  update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string; code?: string } | null }> }
}
