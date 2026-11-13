import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'

export type FounderFigures = {
  followers: number
  peopleUsed: number
  peopleUsedApproximate: boolean
}

export type FounderAutomations = {
  didYouGetIn: boolean
  autoNudge: boolean
  mondayDigest: boolean
}

export const DEFAULT_FIGURES: FounderFigures = {
  followers: 189000,
  peopleUsed: 6000,
  peopleUsedApproximate: true,
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

function whole(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number < 0 || number > 100_000_000) return fallback
  return Math.round(number)
}

export function figuresFrom(value: unknown): FounderFigures {
  const row = asRecord(value)
  return {
    followers: whole(row.followers, DEFAULT_FIGURES.followers),
    peopleUsed: whole(row.peopleUsed, DEFAULT_FIGURES.peopleUsed),
    peopleUsedApproximate: row.peopleUsedApproximate !== false,
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

async function readKey(key: string): Promise<unknown> {
  const admin = createAdminClient() as any
  const { data, error } = await admin.from('platform_settings').select('value').eq('key', key).maybeSingle()
  if (error) return null
  return data?.value ?? null
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

export async function loadFounderSettings(): Promise<{ figures: FounderFigures; automations: FounderAutomations }> {
  const [figures, automations] = await Promise.all([readKey(FIGURES_KEY), readKey(AUTO_KEY)])
  return {
    figures: figuresFrom(figures),
    automations: automationsFrom(automations),
  }
}

export async function saveFounderFigures(figures: FounderFigures): Promise<{ ok: boolean; error?: string }> {
  return writeKey(FIGURES_KEY, figures)
}

export async function saveFounderAutomations(automations: FounderAutomations): Promise<{ ok: boolean; error?: string }> {
  return writeKey(AUTO_KEY, automations)
}

export async function loadDigestStamp(): Promise<string | null> {
  const value = asRecord(await readKey('founder_digest_last'))
  return typeof value.on === 'string' ? value.on : null
}

export async function saveDigestStamp(on: string): Promise<void> {
  await writeKey('founder_digest_last', { on })
}
