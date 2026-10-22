'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient, fetchAllRows } from '@/lib/supabase-admin'

export interface DoctorRoutingRow {
  id: string
  name: string
  clinic: string
  city: string
  state: string
  country: string
  total: number
  last7: number
  last30: number
  lastDate: string | null
  daysSince: number | null
  tier: string
  status: string
  profile_clicks: number
  action_clicks: number
  click_rate: number
  action_rate: number
}

export interface DoctorRoutingSummary {
  total: number
  withRecs: number
  withZero: number
  mean: number
  median: number
  total_profile_clicks: number
  total_action_clicks: number
  overall_click_rate: number
  overall_action_rate: number
  tracking_since: string | null
}

export interface DoctorRoutingData {
  rows: DoctorRoutingRow[]
  summary: DoctorRoutingSummary
}

export async function getDoctorRoutingStats(): Promise<DoctorRoutingData> {
  await checkAdminAuth()
  const admin = createAdminClient()

  // 1. Get ALL verified+pro doctors (must include zeros)
  const doctors = await fetchAllRows(
    admin,
    'doctors',
    'id, first_name, last_name, clinic_name, city, state, country, membership_tier, verification_status',
    (q: any) => q.eq('verification_status', 'verified').eq('membership_tier', 'pro'),
  )

  // 2. Get ALL reply_logs (paginated via fetchAllRows)
  const logs = await fetchAllRows(
    admin,
    'reply_logs',
    'doctor_id, created_at',
  )

  // 3. Get ALL link_clicks (paginated via fetchAllRows)
  const clicks = await fetchAllRows(
    admin,
    'link_clicks',
    'reply_log_id, doctor_id, destination, clicked_at',
  )

  // 4. Aggregate per doctor
  const now = new Date()
  const sevenAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const stats: Record<string, { total: number; last7: number; last30: number; lastDate: string | null }> = {}

  for (const log of logs) {
    const did = log.doctor_id
    if (!did) continue
    if (!stats[did]) stats[did] = { total: 0, last7: 0, last30: 0, lastDate: null }
    stats[did].total++
    const created = new Date(log.created_at)
    if (created > sevenAgo) stats[did].last7++
    if (created > thirtyAgo) stats[did].last30++
    if (!stats[did].lastDate || log.created_at > stats[did].lastDate) {
      stats[did].lastDate = log.created_at
    }
  }

  // Aggregate clicks per doctor
  const ACTION_DESTINATIONS = new Set(['booking', 'phone', 'email', 'website'])
  const clickStats: Record<string, { profile: number; action: number }> = {}

  for (const click of clicks) {
    const did = click.doctor_id
    if (!did) continue
    if (!clickStats[did]) clickStats[did] = { profile: 0, action: 0 }
    if (click.destination === 'profile') clickStats[did].profile++
    else if (ACTION_DESTINATIONS.has(click.destination)) clickStats[did].action++
  }

  // Earliest click timestamp for "Tracking since"
  let earliestClick: string | null = null
  for (const click of clicks) {
    const ts = click.clicked_at
    if (ts && (!earliestClick || ts < earliestClick)) earliestClick = ts
  }

  // 5. Merge: every doctor gets a row, even with 0
  const rows: DoctorRoutingRow[] = doctors.map((d: any) => {
    const s = stats[d.id] || { total: 0, last7: 0, last30: 0, lastDate: null }
    const daysSince = s.lastDate
      ? Math.floor((now.getTime() - new Date(s.lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const cs = clickStats[d.id] || { profile: 0, action: 0 }
    const click_rate = s.total > 0 ? Math.round((cs.profile / s.total) * 1000) / 10 : 0
    const action_rate = cs.profile > 0 ? Math.round((cs.action / cs.profile) * 1000) / 10 : 0
    return {
      id: d.id,
      name: `Dr. ${d.first_name} ${d.last_name}`,
      clinic: d.clinic_name || '',
      city: d.city || '',
      state: d.state || '',
      country: d.country || 'US',
      total: s.total,
      last7: s.last7,
      last30: s.last30,
      lastDate: s.lastDate,
      daysSince,
      tier: d.membership_tier,
      status: d.verification_status,
      profile_clicks: cs.profile,
      action_clicks: cs.action,
      click_rate,
      action_rate,
    }
  })

  // 6. Summary stats (including zeros)
  const allCounts = rows.map((r) => r.total)
  allCounts.sort((a, b) => a - b)
  const withRecs = allCounts.filter((c) => c > 0).length
  const withZero = allCounts.filter((c) => c === 0).length
  const sum = allCounts.reduce((a, b) => a + b, 0)
  const mean = allCounts.length > 0 ? sum / allCounts.length : 0
  const median = allCounts.length > 0 ? allCounts[Math.floor(allCounts.length / 2)] : 0

  const total_profile_clicks = clicks.filter((c) => c.destination === 'profile').length
  const total_action_clicks = clicks.filter((c) => ACTION_DESTINATIONS.has(c.destination)).length
  const overall_click_rate = sum > 0 ? Math.round((total_profile_clicks / sum) * 1000) / 10 : 0
  const overall_action_rate = total_profile_clicks > 0 ? Math.round((total_action_clicks / total_profile_clicks) * 1000) / 10 : 0

  return {
    rows,
    summary: {
      total: rows.length,
      withRecs,
      withZero,
      mean: Math.round(mean * 10) / 10,
      median,
      total_profile_clicks,
      total_action_clicks,
      overall_click_rate,
      overall_action_rate,
      tracking_since: earliestClick,
    },
  }
}
