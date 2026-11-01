/**
 * Shared platform statistics — single source of truth for every page.
 *
 * ONE definition per concept:
 * - Active doctor: verified, US (or null country), valid coordinates (not 0,0, not null)
 * - Pending doctor: verification_status = 'pending'
 * - Invisible doctor: verified or pending, US, coordinates are 0,0 or null
 * - Waitlist subscriber: confirmed status in subscribers table
 *
 * Used by: admin dashboard, coverage map, homepage, /pro page.
 * Never duplicate these queries. Import this module.
 */

import { looseFrom } from '@/lib/admin/loose-query'
import { normalizeCountry, normalizeState } from '@/lib/admin/geo-normalize'
import { isMissingColumn } from '@/lib/leads/schema'
import { createAdminClient, fetchAllRows } from '@/lib/supabase-admin'

export interface DoctorCounts {
  active: number         // verified + valid coords + US
  pending: number        // verification_status = 'pending'
  invisible: number      // verified/pending + (0,0 or null coords)
  international: number  // non-US country, any status
  statesCovered: number
}

export interface SubscriberCounts {
  confirmed: number
  pending: number
}

/**
 * Canonical doctor counts. Every page showing doctor numbers should use this.
 */
function countNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function countRow(row: unknown): { verification_status: string; state: string; country: string; latitude: number | null; longitude: number | null } | null {
  if (!row || typeof row !== 'object') return null
  const record = row as Record<string, unknown>
  const flag = record.is_test
  if (flag === true || flag === 'true' || flag === 't' || flag === 1) return null
  const country = normalizeCountry(typeof record.country === 'string' ? record.country : null)
  return {
    verification_status: typeof record.verification_status === 'string' ? record.verification_status : '',
    state: normalizeState(typeof record.state === 'string' ? record.state : ''),
    country,
    latitude: countNumber(record.latitude),
    longitude: countNumber(record.longitude),
  }
}

export async function getDoctorCounts(): Promise<DoctorCounts> {
  const supabase = createAdminClient()
  const withTest = 'verification_status, state, country, latitude, longitude, is_test'
  const base = 'verification_status, state, country, latitude, longitude'
  const probe = await looseFrom(supabase, 'doctors')
    .select(withTest)
    .in('verification_status', ['verified', 'pending'])
    .eq('is_test', 'false')
    .range(0, 0)
  const rows = probe.error && isMissingColumn(probe.error)
    ? await fetchAllRows(supabase, 'doctors', base, (query) => query.in('verification_status', ['verified', 'pending']))
    : await fetchAllRows(
      supabase,
      'doctors',
      withTest,
      (query) => query.in('verification_status', ['verified', 'pending']).eq('is_test', false),
    )

  const docs = rows.flatMap((row) => {
    const parsed = countRow(row)
    return parsed ? [parsed] : []
  })
  // Empty country stays empty in the helper. This call site still counts it as US.
  const usDocs = docs.filter(d => !d.country || d.country === 'US')
  const intlDocs = docs.filter(d => d.country && d.country !== 'US')

  const active = usDocs.filter(d =>
    d.verification_status === 'verified' &&
    d.latitude != null && d.longitude != null &&
    d.latitude !== 0 && d.longitude !== 0
  ).length

  const pending = usDocs.filter(d => d.verification_status === 'pending').length

  const invisible = usDocs.filter(d =>
    d.latitude == null || d.longitude == null ||
    (d.latitude === 0 && d.longitude === 0)
  ).length

  const coveredStates = new Set<string>()
  for (const d of usDocs) {
    if (d.state && d.verification_status === 'verified' && d.latitude && d.longitude && d.latitude !== 0) {
      coveredStates.add(d.state)
    }
  }

  return {
    active,
    pending,
    invisible,
    international: intlDocs.length,
    statesCovered: coveredStates.size,
  }
}

/**
 * Canonical subscriber counts.
 */
function rowStatus(row: Record<string, unknown>): string {
  return typeof row.status === 'string' ? row.status : ''
}

export async function getSubscriberCounts(): Promise<SubscriberCounts> {
  const supabase = createAdminClient()
  const { data } = await looseFrom(supabase, 'subscribers').select('status')

  const all = data || []
  return {
    confirmed: all.filter((row) => rowStatus(row) === 'confirmed').length,
    pending: all.filter((row) => rowStatus(row) === 'pending').length,
  }
}

/**
 * Canonical demand mention count (Instagram comment requests).
 */
export async function getDemandMentionCount(): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await looseFrom(supabase, 'demand_mentions').select('id', { count: 'exact', head: true })
  return count || 0
}
