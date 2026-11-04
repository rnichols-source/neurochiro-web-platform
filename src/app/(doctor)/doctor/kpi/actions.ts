'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getDoctorTimezone } from '@/lib/doctor-timezone'
import { normalizeCalendar } from '@/lib/kpi/calendar'
import { clinicToday, historyStart, isValidYmd } from '@/lib/kpi/dates'
import { applyAutoLeadCounts, countNeuroChiroLeadsByDay, type LeadEvent } from '@/lib/kpi/leads'
import { compareMonthCollections } from '@/lib/kpi/pl-compare'
import { currencyForCountry } from '@/lib/kpi/currency'
import { IMPORT_FLAG, LIBRARY, type LibraryKpi } from '@/lib/kpi/library'
import { mapLegacyEntry, mapLegacyExtras, mapLegacyGoals, shouldApplyLegacyGoal } from '@/lib/kpi/legacy'
import type { CustomKpiInput, GoalPeriod, KpiDefinition, KpiValue, KpiWorkspace, MonthComparison, OfficeMember } from '@/lib/kpi/types'
import {
  cleanName,
  customDefinition,
  entryDateError,
  isMissingTable,
  parseEntryValue,
  storageDateFor,
  swapSortOrder,
} from '@/lib/kpi/validate'

const ALLOWED_ROLES = new Set(['doctor', 'founder', 'super_admin'])
const ZONE_PATTERN = /^[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)+$/
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const NOT_READY = 'The scorecard is not turned on in the database yet. Numbers you already saved are still stored, and nothing was erased.'
const GENERIC = 'We could not open the scorecard. Refresh and try again.'

type DbError = { code?: string; message?: string }
type DbResult = { data: unknown; error: DbError | null }
type Query = {
  select: (columns?: string) => Query
  insert: (row: unknown) => Query
  update: (row: unknown) => Query
  upsert: (row: unknown, options?: Record<string, unknown>) => Query
  delete: () => Query
  eq: (column: string, value: unknown) => Query
  gte: (column: string, value: unknown) => Query
  order: (column: string, options?: { ascending?: boolean }) => Query
  range: (from: number, to: number) => Query
  limit: (count: number) => Query
  maybeSingle: () => Query
  single: () => Query
  then: Promise<DbResult>['then']
}
type Loose = {
  from: (table: string) => Query
}

type Session = {
  db: Loose
  userId: string
  actorId: string
  actorName: string
  email: string
  role: 'owner' | 'associate' | 'front_desk'
  canViewPl: boolean
  state: string | null
  country: string | null
  doctorId: string | null
  clinicName: string | null
}

function safeZone(zone: string | null | undefined): string | null {
  if (!zone || zone.length > 80 || !ZONE_PATTERN.test(zone)) return null
  return clinicToday(zone, new Date()) ? zone : null
}

function loose(supabase: ReturnType<typeof createServerSupabase>): Loose {
  return supabase as unknown as Loose
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function mapDefinition(row: Record<string, unknown>): KpiDefinition {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description || ''),
    kind: row.kind as KpiDefinition['kind'],
    unit: row.unit as KpiDefinition['unit'],
    frequency: row.entry_frequency as KpiDefinition['frequency'],
    direction: row.direction as KpiDefinition['direction'],
    aggregation: row.aggregation as KpiDefinition['aggregation'],
    formula: row.formula == null ? null : String(row.formula),
    formulaText: row.formula_text == null ? null : String(row.formula_text),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    goalValue: row.goal_value == null || row.goal_value === '' ? null : Number(row.goal_value),
    goalPeriod: (row.goal_period == null ? null : row.goal_period) as GoalPeriod | null,
    isCustom: Boolean(row.is_custom),
  }
}

function libraryRow(userId: string, item: LibraryKpi) {
  return {
    user_id: userId,
    slug: item.slug,
    name: item.name,
    description: item.description,
    kind: item.kind,
    unit: item.unit,
    entry_frequency: item.frequency,
    direction: item.direction,
    aggregation: item.aggregation,
    formula: item.formula,
    formula_text: item.formulaText,
    enabled: item.enabled,
    sort_order: item.sortOrder,
    goal_value: item.goalValue,
    goal_period: item.goalPeriod,
    is_custom: item.isCustom,
    updated_at: new Date().toISOString(),
  }
}

function textOf(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === 'string' && value.trim() ? value : null
}

async function claimInvites(db: Loose, userId: string, email: string) {
  if (!email) return
  const listed = await db.from('kpi_office_members').select('id, email, status, member_user_id').eq('status', 'invited')
  if (listed.error) return
  const rows = Array.isArray(listed.data) ? listed.data : []
  for (const row of rows) {
    const item = record(row)
    if (String(item.email || '').trim().toLowerCase() !== email) continue
    if (item.member_user_id) continue
    await db.from('kpi_office_members').update({
      member_user_id: userId,
      status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', item.id).eq('status', 'invited')
  }
}

async function officeDoctor(officeUserId: string, own: Record<string, unknown> | null): Promise<{
  state: string | null
  country: string | null
  doctorId: string | null
  clinicName: string | null
}> {
  if (own && textOf(own, 'id')) {
    return {
      state: textOf(own, 'state'),
      country: textOf(own, 'country'),
      doctorId: textOf(own, 'id'),
      clinicName: textOf(own, 'clinic_name'),
    }
  }
  try {
    const admin = createAdminClient() as unknown as Loose
    const result = await admin.from('doctors').select('id, state, country, clinic_name').eq('user_id', officeUserId).limit(1)
    const row = record(Array.isArray(result.data) ? result.data[0] : null)
    return {
      state: textOf(row, 'state'),
      country: textOf(row, 'country'),
      doctorId: textOf(row, 'id'),
      clinicName: textOf(row, 'clinic_name'),
    }
  } catch {
    return { state: null, country: null, doctorId: null, clinicName: null }
  }
}

async function requireDoctor(): Promise<Session | { error: string }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to use the scorecard.' }
  const db = loose(supabase)
  const [profileResult, doctorResult] = await Promise.all([
    db.from('profiles').select('role, full_name, email').eq('id', user.id).maybeSingle(),
    db.from('doctors').select('id, state, country, clinic_name').eq('user_id', user.id).limit(1),
  ])
  if (profileResult.error) return { error: GENERIC }
  const profile = record(profileResult.data)
  const profileRole = typeof profile.role === 'string' ? profile.role : ''
  const email = (textOf(profile, 'email') || user.email || '').trim().toLowerCase()
  const actorName = textOf(profile, 'full_name') || email || 'Teammate'
  await claimInvites(db, user.id, email)
  const memberships = await db.from('kpi_office_members').select('office_user_id, role, can_view_pl, status').eq('member_user_id', user.id).eq('status', 'active')
  const memberRows = memberships.error || !Array.isArray(memberships.data) ? [] : memberships.data.map((row) => record(row))
  const ownDoctor = record(Array.isArray(doctorResult.data) ? doctorResult.data[0] : null)
  if (ALLOWED_ROLES.has(profileRole)) {
    const place = await officeDoctor(user.id, textOf(ownDoctor, 'id') ? ownDoctor : null)
    return {
      db,
      userId: user.id,
      actorId: user.id,
      actorName,
      email,
      role: 'owner',
      canViewPl: true,
      ...place,
    }
  }
  const membership = memberRows[0]
  if (!membership) return { error: 'This scorecard is for a doctor or someone they invited.' }
  const officeUserId = String(membership.office_user_id || '')
  if (!ID_PATTERN.test(officeUserId)) return { error: 'This scorecard is for a doctor or someone they invited.' }
  const place = await officeDoctor(officeUserId, null)
  const role = membership.role === 'front_desk' ? 'front_desk' : 'associate'
  return {
    db,
    userId: officeUserId,
    actorId: user.id,
    actorName,
    email,
    role,
    canViewPl: membership.can_view_pl === true,
    ...place,
  }
}

function ownerOnly(session: Session): { error: string } | null {
  if (session.role === 'owner') return null
  return { error: 'Only the doctor can change that.' }
}

async function fetchPages(run: (from: number, to: number) => PromiseLike<DbResult>) {
  const pageSize = 1000
  const rows: unknown[] = []
  for (let from = 0; from < 50000; from += pageSize) {
    const { data, error } = await run(from, from + pageSize - 1)
    if (error) return { rows, error }
    const batch = Array.isArray(data) ? data : []
    rows.push(...batch)
    if (batch.length < pageSize) break
  }
  return { rows, error: null }
}

async function loadDefinitions(db: Loose, userId: string): Promise<{ definitions: KpiDefinition[] } | { error: string; missing?: boolean }> {
  const { rows, error } = await fetchPages((from, to) =>
    db.from('kpi_definitions').select('*').eq('user_id', userId).order('sort_order').range(from, to),
  )
  if (error) {
    return { error: isMissingTable(error) ? NOT_READY : GENERIC, missing: isMissingTable(error) }
  }
  return { definitions: rows.map((row) => mapDefinition(row as Record<string, unknown>)) }
}

async function seedDefinitions(db: Loose, userId: string) {
  const { error } = await db.from('kpi_definitions').upsert(
    LIBRARY.map((item) => libraryRow(userId, item)),
    { onConflict: 'user_id,slug', ignoreDuplicates: true },
  )
  return error as { code?: string; message?: string } | null
}

async function importLegacy(db: Loose, userId: string, definitions: KpiDefinition[]): Promise<KpiDefinition[]> {
  const flag = await db.from('doctor_tool_data').select('tool').eq('user_id', userId).eq('tool', IMPORT_FLAG).maybeSingle()
  if (!flag.error && flag.data) return definitions

  let next = definitions
  const bySlug = () => new Map(next.map((definition) => [definition.slug, definition]))

  const extrasResult = await db.from('doctor_tool_data').select('data').eq('user_id', userId).eq('tool', 'kpi_extras').maybeSingle()
  const extrasRow = record(extrasResult.data)
  const extras = !extrasResult.error && extrasRow.data ? mapLegacyExtras(extrasRow.data) : { points: [], definitions: [] }
  const missingExtras = extras.definitions.filter((item) => !bySlug().has(item.slug))
  if (missingExtras.length > 0) {
    await db.from('kpi_definitions').upsert(
      missingExtras.map((item) => libraryRow(userId, item)),
      { onConflict: 'user_id,slug', ignoreDuplicates: true },
    )
    const reloaded = await loadDefinitions(db, userId)
    if ('definitions' in reloaded) next = reloaded.definitions
  }

  const entryResult = await fetchPages((from, to) =>
    db.from('kpi_entries')
      .select('date, patient_visits, new_patients, collections, no_shows, energy_level')
      .eq('user_id', userId)
      .order('date')
      .range(from, to),
  )
  const points = extras.points.slice()
  if (!entryResult.error) {
    for (const row of entryResult.rows as Record<string, unknown>[]) {
      points.push(...mapLegacyEntry({
        date: String(row.date ?? ''),
        patient_visits: row.patient_visits as number | null,
        new_patients: row.new_patients as number | null,
        collections: row.collections as number | null,
        no_shows: row.no_shows as number | null,
        energy_level: row.energy_level as number | null,
      }))
    }
  }

  const slugs = bySlug()
  const valueRows = []
  for (const point of points) {
    const definition = slugs.get(point.slug)
    if (!definition) continue
    valueRows.push({
      user_id: userId,
      definition_id: definition.id,
      entry_date: point.date,
      value: point.value,
    })
  }
  let copyFailed = false
  for (let index = 0; index < valueRows.length; index += 200) {
    const chunk = valueRows.slice(index, index + 200)
    if (chunk.length === 0) continue
    const inserted = await db.from('kpi_values').upsert(chunk, {
      onConflict: 'user_id,definition_id,entry_date',
      ignoreDuplicates: true,
    })
    if (inserted.error) copyFailed = true
  }

  const goalsResult = await db.from('doctor_tool_data').select('data').eq('user_id', userId).eq('tool', 'kpi_goals').maybeSingle()
  const goalsRow = record(goalsResult.data)
  if (!goalsResult.error && goalsRow.data) {
    const libraryDefaults = new Map(LIBRARY.map((item) => [item.slug, item.goalValue]))
    for (const goal of mapLegacyGoals(goalsRow.data)) {
      const definition = slugs.get(goal.slug)
      if (!definition) continue
      const libraryDefault = libraryDefaults.has(goal.slug) ? libraryDefaults.get(goal.slug) ?? null : null
      if (!shouldApplyLegacyGoal(definition.goalValue, libraryDefault, goal.goalValue)) continue
      await db.from('kpi_definitions').update({
        goal_value: goal.goalValue,
        goal_period: goal.goalPeriod,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('id', definition.id)
    }
  }

  if (points.some((point) => point.slug === 'energy' && point.value > 0)) {
    const energy = slugs.get('energy')
    if (energy && !energy.enabled) {
      await db.from('kpi_definitions').update({
        enabled: true,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('id', energy.id)
    }
  }

  if (!copyFailed) {
    await db.from('doctor_tool_data').upsert({
      user_id: userId,
      tool: IMPORT_FLAG,
      data: { source: 'app' },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,tool' })
  }

  const reloaded = await loadDefinitions(db, userId)
  return 'definitions' in reloaded ? reloaded.definitions : next
}

async function loadCalendar(db: Loose, userId: string) {
  const settings = await db.from('kpi_office_settings').select('open_weekdays').eq('user_id', userId).maybeSingle()
  const closed = await db.from('kpi_closed_dates').select('closed_on').eq('user_id', userId)
  const weekdays = Array.isArray(record(settings.data).open_weekdays)
    ? record(settings.data).open_weekdays as number[]
    : undefined
  const closedDates = closed.error || !Array.isArray(closed.data)
    ? []
    : closed.data.map((row) => String(record(row).closed_on || '').slice(0, 10)).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
  return normalizeCalendar({ openWeekdays: weekdays, closedDates })
}

async function loadLeadEvents(doctorId: string | null, valuesFrom: string): Promise<{ events: LeadEvent[]; ready: boolean }> {
  if (!doctorId) return { events: [], ready: false }
  try {
    const admin = createAdminClient() as unknown as Loose
    const contacts = await admin.from('contact_requests').select('id, email, phone, created_at').eq('doctor_id', doctorId).gte('created_at', valuesFrom).limit(5000)
    let leads = await admin.from('leads').select('id, email, phone, created_at').eq('doctor_id', doctorId).gte('created_at', valuesFrom).limit(5000)
    if (leads.error && /column/i.test(leads.error.message || '')) {
      leads = await admin.from('leads').select('id, email, created_at').eq('doctor_id', doctorId).gte('created_at', valuesFrom).limit(5000)
    }
    if (contacts.error && leads.error) return { events: [], ready: false }
    const events: LeadEvent[] = []
    const take = (rows: unknown, prefix: string) => {
      if (!Array.isArray(rows)) return
      for (const row of rows) {
        const item = record(row)
        const at = textOf(item, 'created_at')
        if (!at) continue
        events.push({ id: `${prefix}:${String(item.id || at)}`, at, email: textOf(item, 'email'), phone: textOf(item, 'phone') })
      }
    }
    if (!contacts.error) take(contacts.data, 'request')
    if (!leads.error) take(leads.data, 'lead')
    return { events, ready: true }
  } catch {
    return { events: [], ready: false }
  }
}

async function loadPlComparison(
  db: Loose,
  userId: string,
  definitions: KpiDefinition[],
  values: KpiValue[],
  today: string,
): Promise<{ months: MonthComparison[] | null; note: string | null }> {
  const result = await db.from('pl_snapshots').select('month, collections_cents').eq('user_id', userId).limit(24)
  if (result.error) return { months: [], note: 'No saved P&L to compare yet.' }
  const snapshots = new Map<string, number>()
  if (Array.isArray(result.data)) {
    for (const row of result.data) {
      const item = record(row)
      const month = textOf(item, 'month')
      const cents = Number(item.collections_cents)
      if (month && /^\d{4}-\d{2}$/.test(month) && Number.isFinite(cents)) snapshots.set(month, cents / 100)
    }
  }
  const collectionsId = definitions.find((item) => item.slug === 'collections')?.id
  const kpi = new Map<string, number>()
  if (collectionsId) {
    for (const value of values) {
      if (value.definitionId !== collectionsId || value.source === 'auto') continue
      const month = value.date.slice(0, 7)
      kpi.set(month, (kpi.get(month) || 0) + value.value)
    }
  }
  const current = today.slice(0, 7)
  const months = Array.from(new Set([current, ...snapshots.keys(), ...kpi.keys()]))
    .filter((month) => month <= current)
    .sort()
    .slice(-6)
    .reverse()
    .map((month) => compareMonthCollections(kpi.has(month) ? kpi.get(month) || 0 : null, snapshots.has(month) ? snapshots.get(month) || 0 : null, month))
  return { months, note: snapshots.size === 0 ? 'No saved P&L to compare yet.' : null }
}

async function loadMembers(db: Loose, userId: string): Promise<OfficeMember[]> {
  const result = await db.from('kpi_office_members').select('id, email, role, can_view_pl, status').eq('office_user_id', userId)
  if (result.error || !Array.isArray(result.data)) return []
  return result.data.map((row) => {
    const item = record(row)
    const role: OfficeMember['role'] = item.role === 'front_desk' ? 'front_desk' : 'associate'
    const status: OfficeMember['status'] = item.status === 'active' || item.status === 'removed' ? item.status : 'invited'
    return {
      id: String(item.id),
      email: String(item.email || ''),
      role,
      canViewPl: item.can_view_pl === true,
      status,
    }
  }).filter((item) => item.status !== 'removed' && item.email)
}

function clinicClock(state: string | null, country: string | null, clientZone: string | undefined) {
  const hint = safeZone(clientZone)
  const timeZone = getDoctorTimezone(state, country, hint || 'America/New_York') || hint || 'America/New_York'
  const today = clinicToday(timeZone, new Date()) || clinicToday('UTC', new Date()) || '1970-01-01'
  return { timeZone, today }
}

export async function getKpiWorkspace(clientTimeZone?: string): Promise<{ ok: true; workspace: KpiWorkspace } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const seedError = await seedDefinitions(session.db, session.userId)
    if (seedError) return { ok: false, error: isMissingTable(seedError) ? NOT_READY : GENERIC }

    const loaded = await loadDefinitions(session.db, session.userId)
    if ('error' in loaded) return { ok: false, error: loaded.error }
    const definitions = await importLegacy(session.db, session.userId, loaded.definitions)
    const { timeZone, today } = clinicClock(session.state, session.country, clientTimeZone)
    const valuesFrom = historyStart(today)

    const [firstValues, dateResult] = await Promise.all([
      fetchPages((from, to) =>
        session.db.from('kpi_values')
          .select('definition_id, entry_date, value, source, entered_by_name')
          .eq('user_id', session.userId)
          .gte('entry_date', valuesFrom)
          .order('entry_date')
          .range(from, to),
      ),
      fetchPages((from, to) =>
        session.db.from('kpi_values')
          .select('entry_date')
          .eq('user_id', session.userId)
          .order('entry_date')
          .range(from, to),
      ),
    ])
    let valueResult = firstValues
    if (valueResult.error && /column/i.test(valueResult.error.message || '')) {
      valueResult = await fetchPages((from, to) =>
        session.db.from('kpi_values')
          .select('definition_id, entry_date, value')
          .eq('user_id', session.userId)
          .gte('entry_date', valuesFrom)
          .order('entry_date')
          .range(from, to),
      )
    }
    if (valueResult.error || dateResult.error) {
      const error = valueResult.error || dateResult.error
      return { ok: false, error: isMissingTable(error) ? NOT_READY : GENERIC }
    }

    let values: KpiValue[] = (valueResult.rows as Record<string, unknown>[]).map((row) => ({
      definitionId: String(row.definition_id),
      date: String(row.entry_date).slice(0, 10),
      value: Number(row.value),
      source: row.source === 'auto' ? 'auto' as const : 'manual' as const,
      enteredByName: typeof row.entered_by_name === 'string' ? row.entered_by_name : null,
    })).filter((row) => Number.isFinite(row.value))

    const loggedDates = Array.from(new Set(
      (dateResult.rows as Record<string, unknown>[]).map((row) => String(row.entry_date).slice(0, 10)),
    ))

    const calendar = await loadCalendar(session.db, session.userId)
    const leadDefinition = definitions.find((item) => item.slug === 'neurochiro_leads')
    const leads = await loadLeadEvents(session.doctorId, valuesFrom)
    let autoLeadDates: string[] = []
    if (leadDefinition && leads.ready) {
      const counts = countNeuroChiroLeadsByDay(leads.events, timeZone)
      const merged = applyAutoLeadCounts(values, leadDefinition.id, counts, valuesFrom, today)
      values = merged.values
      autoLeadDates = merged.autoDates
    }
    const pl = session.canViewPl
      ? await loadPlComparison(session.db, session.userId, definitions, values, today)
      : { months: null, note: null }
    const members = session.role === 'owner' ? await loadMembers(session.db, session.userId) : []

    return {
      ok: true,
      workspace: {
        timeZone,
        today,
        currency: currencyForCountry(session.country),
        valuesFrom,
        definitions,
        values,
        loggedDates,
        openWeekdays: calendar.openWeekdays,
        closedDates: calendar.closedDates,
        autoLeadDates,
        leadCounts: Array.from(countNeuroChiroLeadsByDay(leads.events, timeZone).entries()).map(([date, count]) => ({ date, count })),
        leadCountReady: leads.ready,
        plMonths: pl.months,
        plNote: pl.note,
        access: {
          role: session.role,
          canViewPl: session.canViewPl,
          clinicName: session.clinicName,
          actorName: session.actorName,
        },
        members,
      },
    }
  } catch {
    return { ok: false, error: GENERIC }
  }
}

async function ownedDefinition(db: Loose, userId: string, definitionId: string): Promise<KpiDefinition | null> {
  if (!ID_PATTERN.test(definitionId)) return null
  const { data, error } = await db.from('kpi_definitions').select('*').eq('user_id', userId).eq('id', definitionId).maybeSingle()
  if (error || !data) return null
  return mapDefinition(data as Record<string, unknown>)
}

export async function saveKpiValue(
  definitionId: string,
  date: string,
  value: number | null,
  clientTimeZone?: string,
): Promise<{ ok: true; savedDate: string } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const definition = await ownedDefinition(session.db, session.userId, definitionId)
    if (!definition) return { ok: false, error: 'That measure is not on your scorecard.' }
    if (definition.kind !== 'entered') return { ok: false, error: 'That number is calculated from the others.' }
    const { today } = clinicClock(session.state, session.country, clientTimeZone)
    const dateError = entryDateError(date, today)
    if (dateError) return { ok: false, error: dateError }
    const parsed = parseEntryValue(value, definition.unit)
    if (parsed && typeof parsed === 'object' && 'error' in parsed) return { ok: false, error: parsed.error }
    const entryDate = storageDateFor(definition, date)
    if (parsed == null) {
      const { error } = await session.db.from('kpi_values').delete().eq('user_id', session.userId).eq('definition_id', definition.id).eq('entry_date', entryDate)
      if (error) return { ok: false, error: 'Could not clear that number. Try again.' }
      return { ok: true, savedDate: entryDate }
    }
    const saved = await session.db.from('kpi_values').upsert({
      user_id: session.userId,
      definition_id: definition.id,
      entry_date: entryDate,
      value: parsed,
      source: 'manual',
      entered_by: session.actorId,
      entered_by_name: session.actorName,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,definition_id,entry_date' })
    if (saved.error && /column/i.test(saved.error.message || '')) {
      const retry = await session.db.from('kpi_values').upsert({
        user_id: session.userId,
        definition_id: definition.id,
        entry_date: entryDate,
        value: parsed,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,definition_id,entry_date' })
      if (retry.error) return { ok: false, error: 'Could not save that number. Try again.' }
      return { ok: true, savedDate: entryDate }
    }
    if (saved.error) return { ok: false, error: 'Could not save that number. Try again.' }
    return { ok: true, savedDate: entryDate }
  } catch {
    return { ok: false, error: 'Could not save that number. Try again.' }
  }
}

export async function setKpiEnabled(
  definitionId: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const definition = await ownedDefinition(session.db, session.userId, definitionId)
    if (!definition) return { ok: false, error: 'That measure is not on your scorecard.' }
    const { error } = await session.db.from('kpi_definitions').update({
      enabled: Boolean(enabled),
      updated_at: new Date().toISOString(),
    }).eq('user_id', session.userId).eq('id', definition.id)
    if (error) return { ok: false, error: 'Could not update that measure. Try again.' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update that measure. Try again.' }
  }
}

export async function moveKpi(
  definitionId: string,
  direction: 'up' | 'down',
): Promise<{ ok: true; order: { id: string; sortOrder: number }[] } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const loaded = await loadDefinitions(session.db, session.userId)
    if ('error' in loaded) return { ok: false, error: loaded.error }
    const order = swapSortOrder(loaded.definitions, definitionId, direction)
    if (!order) return { ok: false, error: 'That measure cannot move further.' }
    for (const item of order) {
      const { error } = await session.db.from('kpi_definitions').update({
        sort_order: item.sortOrder,
        updated_at: new Date().toISOString(),
      }).eq('user_id', session.userId).eq('id', item.id)
      if (error) return { ok: false, error: 'Could not reorder. Try again.' }
    }
    return { ok: true, order }
  } catch {
    return { ok: false, error: 'Could not reorder. Try again.' }
  }
}

export async function setKpiGoal(
  definitionId: string,
  goalValue: number | null,
  goalPeriod: GoalPeriod | null,
): Promise<{ ok: true; goalValue: number | null; goalPeriod: GoalPeriod | null } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const definition = await ownedDefinition(session.db, session.userId, definitionId)
    if (!definition) return { ok: false, error: 'That measure is not on your scorecard.' }
    let stored: number | null = null
    let period: GoalPeriod | null = null
    if (goalValue != null) {
      const parsed = parseEntryValue(goalValue, definition.unit)
      if (parsed && typeof parsed === 'object' && 'error' in parsed) return { ok: false, error: parsed.error }
      stored = parsed
      const ratio = definition.aggregation === 'ratio' || definition.aggregation === 'latest' || definition.aggregation === 'average' || definition.unit === 'percent'
      period = ratio ? null : (goalPeriod === 'weekly' || goalPeriod === 'monthly' || goalPeriod === 'daily' ? goalPeriod : definition.goalPeriod)
    }
    const { error } = await session.db.from('kpi_definitions').update({
      goal_value: stored,
      goal_period: period,
      updated_at: new Date().toISOString(),
    }).eq('user_id', session.userId).eq('id', definition.id)
    if (error) return { ok: false, error: 'Could not save that goal. Try again.' }
    return { ok: true, goalValue: stored, goalPeriod: period }
  } catch {
    return { ok: false, error: 'Could not save that goal. Try again.' }
  }
}

export async function createCustomKpi(
  input: CustomKpiInput,
): Promise<{ ok: true; definition: KpiDefinition } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const loaded = await loadDefinitions(session.db, session.userId)
    if ('error' in loaded) return { ok: false, error: loaded.error }
    const sortOrder = loaded.definitions.reduce((max, definition) => Math.max(max, definition.sortOrder), 0) + 10
    const built = customDefinition(input, sortOrder)
    if ('error' in built) return { ok: false, error: built.error }
    const slug = `custom_${crypto.randomUUID()}`
    const { data, error } = await session.db.from('kpi_definitions').insert({
      ...libraryRow(session.userId, { ...built, slug }),
    }).select('*').single()
    if (error || !data) return { ok: false, error: 'Could not add that measure. Try again.' }
    return { ok: true, definition: mapDefinition(data as Record<string, unknown>) }
  } catch {
    return { ok: false, error: 'Could not add that measure. Try again.' }
  }
}

export async function renameKpi(
  definitionId: string,
  name: string,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const definition = await ownedDefinition(session.db, session.userId, definitionId)
    if (!definition) return { ok: false, error: 'That measure is not on your scorecard.' }
    if (!definition.isCustom) return { ok: false, error: 'The built-in names stay as they are. You can hide one and add your own.' }
    const cleaned = cleanName(name)
    if (!cleaned) return { ok: false, error: 'Give the measure a name, up to 48 characters.' }
    const { error } = await session.db.from('kpi_definitions').update({
      name: cleaned,
      updated_at: new Date().toISOString(),
    }).eq('user_id', session.userId).eq('id', definition.id)
    if (error) return { ok: false, error: 'Could not rename that measure. Try again.' }
    return { ok: true, name: cleaned }
  } catch {
    return { ok: false, error: 'Could not rename that measure. Try again.' }
  }
}

export async function lookupStaffOffice(userId: string): Promise<boolean> {
  if (!ID_PATTERN.test(userId)) return false
  try {
    const supabase = createServerSupabase()
    const db = loose(supabase)
    const result = await db.from('kpi_office_members').select('id').eq('member_user_id', userId).eq('status', 'active').limit(1)
    return !result.error && Array.isArray(result.data) && result.data.length > 0
  } catch {
    return false
  }
}

export async function saveOfficeWeekdays(openWeekdays: number[]): Promise<{ ok: true; openWeekdays: number[] } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const calendar = normalizeCalendar({ openWeekdays, closedDates: [] })
    const { error } = await session.db.from('kpi_office_settings').upsert({
      user_id: session.userId,
      open_weekdays: calendar.openWeekdays,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) return { ok: false, error: 'Could not save the open days. Try again.' }
    return { ok: true, openWeekdays: calendar.openWeekdays }
  } catch {
    return { ok: false, error: 'Could not save the open days. Try again.' }
  }
}

export async function addClosedDate(date: string, note: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    if (!isValidYmd(date)) return { ok: false, error: 'That date is not valid.' }
    const { error } = await session.db.from('kpi_closed_dates').upsert({
      user_id: session.userId,
      closed_on: date,
      note: note?.trim() ? note.trim().slice(0, 80) : null,
    }, { onConflict: 'user_id,closed_on' })
    if (error) return { ok: false, error: 'Could not mark that day closed. Try again.' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not mark that day closed. Try again.' }
  }
}

export async function removeClosedDate(date: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const { error } = await session.db.from('kpi_closed_dates').delete().eq('user_id', session.userId).eq('closed_on', date)
    if (error) return { ok: false, error: 'Could not reopen that day. Try again.' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not reopen that day. Try again.' }
  }
}

async function sendInviteEmail(email: string, clinicName: string | null) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const from = process.env.RESEND_FROM_EMAIL || 'NeuroChiro <hello@neurochiro.co>'
    const clinic = clinicName || 'the office'
    await resend.emails.send({
      from,
      to: email,
      subject: `You are invited to the scorecard for ${clinic}`,
      text: `Sign in at https://neurochiro.co/login with this email address, then open the KPI tracker. You can enter the daily numbers for ${clinic}.`,
    })
  } catch {
    // The invite is saved even when the email cannot be sent.
  }
}

export async function inviteOfficeMember(
  email: string,
  role: 'associate' | 'front_desk',
  canViewPl: boolean,
): Promise<{ ok: true; member: OfficeMember } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    const cleaned = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return { ok: false, error: 'Enter a valid email address.' }
    if (cleaned === session.email) return { ok: false, error: 'That is your own email.' }
    const memberRole = role === 'front_desk' ? 'front_desk' : 'associate'
    const existing = await session.db.from('kpi_office_members').select('id').eq('office_user_id', session.userId).eq('email', cleaned).maybeSingle()
    let id = ''
    if (!existing.error && record(existing.data).id) {
      id = String(record(existing.data).id)
      const updated = await session.db.from('kpi_office_members').update({
        role: memberRole,
        can_view_pl: Boolean(canViewPl),
        status: 'invited',
        member_user_id: null,
        updated_at: new Date().toISOString(),
      }).eq('id', id).eq('office_user_id', session.userId)
      if (updated.error) return { ok: false, error: 'Could not send that invite. Try again.' }
    } else {
      const inserted = await session.db.from('kpi_office_members').insert({
        office_user_id: session.userId,
        email: cleaned,
        role: memberRole,
        can_view_pl: Boolean(canViewPl),
        status: 'invited',
      }).select('id').single()
      if (inserted.error || !record(inserted.data).id) return { ok: false, error: 'Could not send that invite. Try again.' }
      id = String(record(inserted.data).id)
    }
    await sendInviteEmail(cleaned, session.clinicName)
    return {
      ok: true,
      member: { id, email: cleaned, role: memberRole, canViewPl: Boolean(canViewPl), status: 'invited' },
    }
  } catch {
    return { ok: false, error: 'Could not send that invite. Try again.' }
  }
}

export async function removeOfficeMember(memberId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireDoctor()
    if ('error' in session) return { ok: false, error: session.error }
    const denied = ownerOnly(session)
    if (denied) return { ok: false, error: denied.error }
    if (!ID_PATTERN.test(memberId)) return { ok: false, error: 'That person is not on the list.' }
    const { error } = await session.db.from('kpi_office_members').update({
      status: 'removed',
      updated_at: new Date().toISOString(),
    }).eq('id', memberId).eq('office_user_id', session.userId)
    if (error) return { ok: false, error: 'Could not remove that person. Try again.' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not remove that person. Try again.' }
  }
}
