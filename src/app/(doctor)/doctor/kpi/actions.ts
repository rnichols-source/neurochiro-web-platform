'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { getDoctorTimezone } from '@/lib/doctor-timezone'
import { clinicToday, historyStart } from '@/lib/kpi/dates'
import { currencyForCountry } from '@/lib/kpi/currency'
import { IMPORT_FLAG, LIBRARY, type LibraryKpi } from '@/lib/kpi/library'
import { mapLegacyEntry, mapLegacyExtras, mapLegacyGoals, shouldApplyLegacyGoal } from '@/lib/kpi/legacy'
import type { CustomKpiInput, GoalPeriod, KpiDefinition, KpiValue, KpiWorkspace } from '@/lib/kpi/types'
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
  state: string | null
  country: string | null
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

async function requireDoctor(): Promise<Session | { error: string }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to use the scorecard.' }
  const db = loose(supabase)
  const [profileResult, doctorResult] = await Promise.all([
    db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    db.from('doctors').select('state, country').eq('user_id', user.id).limit(1),
  ])
  if (profileResult.error) return { error: GENERIC }
  const profile = record(profileResult.data)
  const role = typeof profile.role === 'string' ? profile.role : ''
  if (!ALLOWED_ROLES.has(role)) return { error: 'This scorecard is for doctors.' }
  const doctorRows = Array.isArray(doctorResult.data) ? doctorResult.data : []
  const doctor = record(doctorRows[0])
  return {
    db,
    userId: user.id,
    state: typeof doctor.state === 'string' ? doctor.state : null,
    country: typeof doctor.country === 'string' ? doctor.country : null,
  }
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

    const [valueResult, dateResult] = await Promise.all([
      fetchPages((from, to) =>
        session.db.from('kpi_values')
          .select('definition_id, entry_date, value')
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
    if (valueResult.error || dateResult.error) {
      const error = valueResult.error || dateResult.error
      return { ok: false, error: isMissingTable(error) ? NOT_READY : GENERIC }
    }

    const values: KpiValue[] = (valueResult.rows as Record<string, unknown>[]).map((row) => ({
      definitionId: String(row.definition_id),
      date: String(row.entry_date).slice(0, 10),
      value: Number(row.value),
    })).filter((row) => Number.isFinite(row.value))

    const loggedDates = Array.from(new Set(
      (dateResult.rows as Record<string, unknown>[]).map((row) => String(row.entry_date).slice(0, 10)),
    ))

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
    const { error } = await session.db.from('kpi_values').upsert({
      user_id: session.userId,
      definition_id: definition.id,
      entry_date: entryDate,
      value: parsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,definition_id,entry_date' })
    if (error) return { ok: false, error: 'Could not save that number. Try again.' }
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
