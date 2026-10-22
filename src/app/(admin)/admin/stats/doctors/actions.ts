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
}

export interface DoctorRoutingSummary {
  total: number
  withRecs: number
  withZero: number
  mean: number
  median: number
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

  // 3. Aggregate per doctor
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

  // 4. Merge: every doctor gets a row, even with 0
  const rows: DoctorRoutingRow[] = doctors.map((d: any) => {
    const s = stats[d.id] || { total: 0, last7: 0, last30: 0, lastDate: null }
    const daysSince = s.lastDate
      ? Math.floor((now.getTime() - new Date(s.lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : null
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
    }
  })

  // 5. Summary stats (including zeros)
  const allCounts = rows.map((r) => r.total)
  allCounts.sort((a, b) => a - b)
  const withRecs = allCounts.filter((c) => c > 0).length
  const withZero = allCounts.filter((c) => c === 0).length
  const sum = allCounts.reduce((a, b) => a + b, 0)
  const mean = allCounts.length > 0 ? sum / allCounts.length : 0
  const median = allCounts.length > 0 ? allCounts[Math.floor(allCounts.length / 2)] : 0

  return {
    rows,
    summary: { total: rows.length, withRecs, withZero, mean: Math.round(mean * 10) / 10, median },
  }
}
