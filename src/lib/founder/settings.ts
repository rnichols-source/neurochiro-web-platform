import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'

export type FounderFigures = {
  followers: number | null
  peopleUsed: number | null
  peopleUsedApproximate: boolean
  carePlansStarted: number | null
  averageCarePlan: number | null
}

export type FounderAutomations = {
  didYouGetIn: boolean
  autoNudge: boolean
  mondayDigest: boolean
}

export const EMPTY_FIGURES: FounderFigures = {
  followers: null,
  peopleUsed: null,
  peopleUsedApproximate: true,
  carePlansStarted: null,
  averageCarePlan: null,
}

/** Old placeholders. Nothing in the admin should display these as live numbers. */
export const DEFAULT_FIGURES: FounderFigures = {
  followers: null,
  peopleUsed: null,
  peopleUsedApproximate: true,
  carePlansStarted: null,
  averageCarePlan: null,
}

export const DEFAULT_AUTOMATIONS: FounderAutomations = {
  didYouGetIn: false,
  autoNudge: false,
  mondayDigest: true,
}

const FIGURES_KEY = 'founder_figures'
const AUTO_KEY = 'founder_automations'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function optionalWhole(value: unknown): number | null {
  if (value == null || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number < 0 || number > 100_000_000) return null
  return Math.round(number)
}

export function figuresFrom(value: unknown): FounderFigures {
  if (value == null) return { ...EMPTY_FIGURES }
  const row = asRecord(value)
  return {
    followers: optionalWhole(row.followers),
    peopleUsed: optionalWhole(row.peopleUsed),
    peopleUsedApproximate: row.peopleUsedApproximate !== false,
    carePlansStarted: optionalWhole(row.carePlansStarted),
    averageCarePlan: optionalWhole(row.averageCarePlan),
  }
}

export function automationsFrom(value: unknown): FounderAutomations {
  const row = asRecord(value)
  return {
    didYouGetIn: row.didYouGetIn === true,
    autoNudge: row.autoNudge === true,
    mondayDigest: row.mondayDigest !== false,
  }
}

async function readKey(key: string): Promise<{ value: unknown; missing: boolean; error: boolean }> {
  try {
    const admin = createAdminClient() as any
    const { data, error } = await admin.from('platform_settings').select('value').eq('key', key).maybeSingle()
    if (error) return { value: null, missing: false, error: true }
    if (!data) return { value: null, missing: true, error: false }
    return { value: data.value ?? null, missing: false, error: false }
  } catch {
    return { value: null, missing: false, error: true }
  }
}

async function writeKey(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient() as any
  const saved = await admin.from('platform_settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  })
  if (saved.error) return { ok: false, error: saved.error.message }
  return { ok: true }
}

export async function loadFounderSettings(): Promise<{ figures: FounderFigures; automations: FounderAutomations; saved: boolean; error: boolean }> {
  const [figures, automations] = await Promise.all([readKey(FIGURES_KEY), readKey(AUTO_KEY)])
  if (figures.error) {
    return { figures: { ...EMPTY_FIGURES }, automations: automationsFrom(null), saved: false, error: true }
  }
  return {
    figures: figuresFrom(figures.value),
    automations: automationsFrom(automations.error ? null : automations.value),
    saved: !figures.missing && figures.value != null,
    error: false,
  }
}

export async function saveFounderFigures(figures: FounderFigures): Promise<{ ok: boolean; error?: string }> {
  return writeKey(FIGURES_KEY, figures)
}

export async function saveFounderAutomations(automations: FounderAutomations): Promise<{ ok: boolean; error?: string }> {
  return writeKey(AUTO_KEY, automations)
}

export async function loadDigestStamp(): Promise<string | null> {
  const read = await readKey('founder_digest_last')
  const value = asRecord(read.value)
  return typeof value.on === 'string' ? value.on : null
}

export async function saveDigestStamp(on: string): Promise<void> {
  await writeKey('founder_digest_last', { on })
}
