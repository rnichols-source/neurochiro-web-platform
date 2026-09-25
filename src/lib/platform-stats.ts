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

import { createAdminClient } from '@/lib/supabase-admin'

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
export async function getDoctorCounts(): Promise<DoctorCounts> {
  const supabase = createAdminClient()

  const { data: allDocs } = await supabase
    .from('doctors')
    .select('verification_status, state, country, latitude, longitude')
    .in('verification_status', ['verified', 'pending'])

  const docs = allDocs || []
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
      coveredStates.add(d.state.toUpperCase())
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
export async function getSubscriberCounts(): Promise<SubscriberCounts> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('subscribers')
    .select('status')

  const all = data || []
  return {
    confirmed: all.filter((s: any) => s.status === 'confirmed').length,
    pending: all.filter((s: any) => s.status === 'pending').length,
  }
}
