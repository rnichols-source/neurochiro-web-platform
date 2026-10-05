'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const TZ = 'America/New_York'
const TRACKING_SINCE = '2026-09-27'

// ── Types ──

export interface DailyCount {
  date: string // YYYY-MM-DD in ET
  recommendations: number
  waitlist: number
}

export interface RecommendationDetail {
  id: string
  timestamp_et: string
  searched_city: string
  searched_state: string | null
  doctor_name: string | null
  doctor_city: string | null
  template_type: string
}

export interface RangeStats {
  recommendations: number
  waitlist: number
  coverageRate: number
  rawActions: number
  distinctDoctors: number
  distinctCities: number
  bestDay: { date: string; count: number } | null
  byType: { standard: number; far: number; waitlist: number }
  avg7d: number | null
  avg30d: number | null
  avgAllTime: number | null
  trackingSince: string
  trackingDays: number
}

// ── Dedupe logic ──
// A recommendation = one sent_to_patient row, deduped by collapsing
// same (searched_city, doctor_id) within 60 seconds of each other.
// This catches accidental double-clicks without losing real repeats.

const DEDUPE_RECS_SQL = `
  WITH sent AS (
    SELECT id, searched_city, searched_state, doctor_id, created_at, template_id,
      (created_at AT TIME ZONE '${TZ}')::date as et_date,
      (created_at AT TIME ZONE '${TZ}')::time as et_time,
      LAG(created_at) OVER (
        PARTITION BY searched_city, COALESCE(doctor_id::text,'')
        ORDER BY created_at
      ) as prev_at
    FROM reply_logs WHERE template_id = 'sent_to_patient'
  )
  SELECT * FROM sent
  WHERE prev_at IS NULL OR EXTRACT(EPOCH FROM (created_at - prev_at)) > 60
`

const DEDUPE_WAITLIST_SQL = `
  WITH wl AS (
    SELECT id, searched_city, searched_state, created_at, template_id,
      (created_at AT TIME ZONE '${TZ}')::date as et_date,
      (created_at AT TIME ZONE '${TZ}')::time as et_time,
      LAG(created_at) OVER (
        PARTITION BY searched_city
        ORDER BY created_at
      ) as prev_at
    FROM reply_logs WHERE template_id IN ('waitlist_dm','waitlist_comment')
  )
  SELECT * FROM wl
  WHERE prev_at IS NULL OR EXTRACT(EPOCH FROM (created_at - prev_at)) > 60
`

// ── Queries ──

export async function getRecommendationStats(): Promise<RangeStats> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { data: dailyRecs } = await (supabase as any).rpc('exec_raw_query', {
    q: `WITH d AS (${DEDUPE_RECS_SQL}) SELECT et_date, count(*) as c FROM d GROUP BY et_date ORDER BY et_date`
  })

  // Can't use RPC since we dropped exec_sql. Use raw queries via the REST approach.
  // Instead, run the dedupe in application code.

  const { data: allSent } = await (supabase as any)
    .from('reply_logs')
    .select('id, searched_city, searched_state, doctor_id, created_at, template_id')
    .eq('template_id', 'sent_to_patient')
    .order('created_at', { ascending: true })

  const { data: allWaitlist } = await (supabase as any)
    .from('reply_logs')
    .select('id, searched_city, searched_state, created_at, template_id')
    .in('template_id', ['waitlist_dm', 'waitlist_comment'])
    .order('created_at', { ascending: true })

  const { data: allRaw } = await (supabase as any)
    .from('reply_logs')
    .select('id', { count: 'exact', head: true })

  const rawCount = allRaw || 0

  // Dedupe recommendations (60s rule)
  const recs = dedupeRows(allSent || [], true)
  const waitlist = dedupeRows(allWaitlist || [], false)

  // Bucket by ET date
  const recsByDate = new Map<string, number>()
  const wlByDate = new Map<string, number>()
  const recDoctorsByDate = new Map<string, Set<string>>()
  const recCitiesByDate = new Map<string, Set<string>>()

  let standardCount = 0
  let farCount = 0

  for (const r of recs) {
    const etDate = toETDate(r.created_at)
    recsByDate.set(etDate, (recsByDate.get(etDate) || 0) + 1)
    if (r.doctor_id) {
      if (!recDoctorsByDate.has(etDate)) recDoctorsByDate.set(etDate, new Set())
      recDoctorsByDate.get(etDate)!.add(r.doctor_id)
    }
    if (!recCitiesByDate.has(etDate)) recCitiesByDate.set(etDate, new Set())
    recCitiesByDate.get(etDate)!.add(r.searched_city || '')
  }

  for (const w of waitlist) {
    const etDate = toETDate(w.created_at)
    wlByDate.set(etDate, (wlByDate.get(etDate) || 0) + 1)
  }

  // Check far vs standard from the original sent rows' nearby template logs
  // Since sent_to_patient doesn't distinguish, count far from doctor_dm_far/doctor_comment_far
  const { data: farRows } = await (supabase as any)
    .from('reply_logs')
    .select('id', { count: 'exact', head: true })
    .in('template_id', ['doctor_dm_far', 'doctor_comment_far'])
  farCount = farRows || 0

  const totalRecs = recs.length
  const totalWaitlist = waitlist.length
  const totalRaw = rawCount

  // Distinct doctors and cities all-time
  const allDoctors = new Set(recs.filter(r => r.doctor_id).map(r => r.doctor_id))
  const allCities = new Set(recs.map(r => r.searched_city || ''))

  // Best day
  let bestDay: { date: string; count: number } | null = null
  for (const [date, count] of recsByDate) {
    if (!bestDay || count > bestDay.count) bestDay = { date, count }
  }

  // Averages
  const trackingDays = Math.max(1, daysBetween(TRACKING_SINCE, toETDate(new Date().toISOString())))
  const avg7d = trackingDays >= 7 ? Math.round(totalRecs / Math.min(trackingDays, 7) * 10) / 10 : null
  const avg30d = trackingDays >= 30 ? Math.round(totalRecs / Math.min(trackingDays, 30) * 10) / 10 : null
  const avgAllTime = trackingDays >= 90 ? Math.round(totalRecs / trackingDays * 10) / 10 : null

  // 7-day average: sum of last 7 days / 7
  const today = toETDate(new Date().toISOString())
  let last7Sum = 0
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i)
    last7Sum += recsByDate.get(d) || 0
  }
  const computed7dAvg = Math.round(last7Sum / 7 * 10) / 10

  const coverageRate = totalRecs + totalWaitlist > 0
    ? Math.round(totalRecs / (totalRecs + totalWaitlist) * 1000) / 10
    : 0

  return {
    recommendations: totalRecs,
    waitlist: totalWaitlist,
    coverageRate,
    rawActions: totalRaw,
    distinctDoctors: allDoctors.size,
    distinctCities: allCities.size,
    bestDay,
    byType: { standard: totalRecs - farCount, far: farCount, waitlist: totalWaitlist },
    avg7d: computed7dAvg,
    avg30d: trackingDays >= 30 ? avg30d : null,
    avgAllTime: trackingDays >= 90 ? avgAllTime : null,
    trackingSince: TRACKING_SINCE,
    trackingDays,
  }
}

export async function getDailyData(): Promise<DailyCount[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { data: allSent } = await (supabase as any)
    .from('reply_logs')
    .select('id, searched_city, doctor_id, created_at')
    .eq('template_id', 'sent_to_patient')
    .order('created_at', { ascending: true })

  const { data: allWaitlist } = await (supabase as any)
    .from('reply_logs')
    .select('id, searched_city, created_at')
    .in('template_id', ['waitlist_dm', 'waitlist_comment'])
    .order('created_at', { ascending: true })

  const recs = dedupeRows(allSent || [], true)
  const waitlist = dedupeRows(allWaitlist || [], false)

  const recsByDate = new Map<string, number>()
  const wlByDate = new Map<string, number>()

  for (const r of recs) {
    const d = toETDate(r.created_at)
    recsByDate.set(d, (recsByDate.get(d) || 0) + 1)
  }
  for (const w of waitlist) {
    const d = toETDate(w.created_at)
    wlByDate.set(d, (wlByDate.get(d) || 0) + 1)
  }

  // Fill in zero days
  const result: DailyCount[] = []
  const today = toETDate(new Date().toISOString())
  const start = TRACKING_SINCE
  let current = start
  while (current <= today) {
    result.push({
      date: current,
      recommendations: recsByDate.get(current) || 0,
      waitlist: wlByDate.get(current) || 0,
    })
    current = addDays(current, 1)
  }

  return result
}

export async function getDayDrilldown(date: string): Promise<RecommendationDetail[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Get all sent_to_patient and waitlist for that ET date
  // ET date range: date 00:00 ET to date+1 00:00 ET
  const startUTC = etDateToUTCRange(date)
  const endUTC = etDateToUTCRange(addDays(date, 1))

  const { data: rows } = await (supabase as any)
    .from('reply_logs')
    .select('id, searched_city, searched_state, doctor_id, created_at, template_id')
    .in('template_id', ['sent_to_patient', 'waitlist_dm', 'waitlist_comment'])
    .gte('created_at', startUTC)
    .lt('created_at', endUTC)
    .order('created_at', { ascending: true })

  if (!rows || rows.length === 0) return []

  // Separate and dedupe
  const sentRows = rows.filter((r: any) => r.template_id === 'sent_to_patient')
  const waitlistRows = rows.filter((r: any) => r.template_id !== 'sent_to_patient')

  const deduped = [
    ...dedupeRows(sentRows, true),
    ...dedupeRows(waitlistRows, false),
  ]

  // Get doctor names
  const doctorIds = [...new Set(deduped.filter(r => r.doctor_id).map(r => r.doctor_id))]
  const { data: doctors } = doctorIds.length > 0
    ? await (supabase as any).from('doctors').select('id, first_name, last_name, city').in('id', doctorIds)
    : { data: [] }

  const docMap = new Map<string, any>()
  for (const d of (doctors || [])) docMap.set(d.id, d)

  return deduped.map(r => {
    const doc = r.doctor_id ? docMap.get(r.doctor_id) : null
    const isWaitlist = r.template_id !== 'sent_to_patient'
    return {
      id: r.id,
      timestamp_et: toETTimestamp(r.created_at),
      searched_city: r.searched_city || '',
      searched_state: r.searched_state || null,
      doctor_name: doc ? `Dr. ${doc.first_name} ${doc.last_name}` : null,
      doctor_city: doc?.city || null,
      template_type: isWaitlist ? 'waitlist' : 'recommendation',
    }
  }).sort((a, b) => a.timestamp_et.localeCompare(b.timestamp_et))
}

export async function getRangeStats(startDate: string, endDate: string): Promise<{
  recommendations: number
  waitlist: number
  coverageRate: number
  distinctDoctors: number
  distinctCities: number
  bestDay: { date: string; count: number } | null
  byType: { standard: number; far: number; waitlist: number }
  marketingSentence: string
}> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const startUTC = etDateToUTCRange(startDate)
  const endUTC = etDateToUTCRange(addDays(endDate, 1))

  const { data: sentRows } = await (supabase as any)
    .from('reply_logs')
    .select('id, searched_city, searched_state, doctor_id, created_at')
    .eq('template_id', 'sent_to_patient')
    .gte('created_at', startUTC)
    .lt('created_at', endUTC)
    .order('created_at', { ascending: true })

  const { data: waitlistRows } = await (supabase as any)
    .from('reply_logs')
    .select('id, searched_city, created_at')
    .in('template_id', ['waitlist_dm', 'waitlist_comment'])
    .gte('created_at', startUTC)
    .lt('created_at', endUTC)
    .order('created_at', { ascending: true })

  const recs = dedupeRows(sentRows || [], true)
  const waitlist = dedupeRows(waitlistRows || [], false)

  const recsByDate = new Map<string, number>()
  for (const r of recs) {
    const d = toETDate(r.created_at)
    recsByDate.set(d, (recsByDate.get(d) || 0) + 1)
  }

  let bestDay: { date: string; count: number } | null = null
  for (const [date, count] of recsByDate) {
    if (!bestDay || count > bestDay.count) bestDay = { date, count }
  }

  const distinctDoctors = new Set(recs.filter(r => r.doctor_id).map(r => r.doctor_id)).size
  const distinctCities = new Set(recs.map(r => r.searched_city || '')).size

  const totalRecs = recs.length
  const totalWaitlist = waitlist.length
  const coverageRate = totalRecs + totalWaitlist > 0
    ? Math.round(totalRecs / (totalRecs + totalWaitlist) * 1000) / 10
    : 0

  // Range label for marketing sentence
  const days = daysBetween(startDate, endDate) + 1
  let rangeLabel = ''
  if (days <= 7) rangeLabel = `In the last ${days} days`
  else if (days <= 31) rangeLabel = `In the last ${days} days`
  else rangeLabel = `From ${startDate} to ${endDate}`

  const marketingSentence = totalRecs > 0
    ? `${rangeLabel} I sent ${totalRecs.toLocaleString()} people to a nervous system chiropractor near them, across ${distinctCities.toLocaleString()} cities and ${distinctDoctors} doctors.`
    : `${rangeLabel}, no recommendations were sent.`

  return {
    recommendations: totalRecs,
    waitlist: totalWaitlist,
    coverageRate,
    distinctDoctors,
    distinctCities,
    bestDay,
    byType: { standard: totalRecs, far: 0, waitlist: totalWaitlist },
    marketingSentence,
  }
}

// ── Helpers ──

function dedupeRows(rows: any[], byDoctor: boolean): any[] {
  if (rows.length === 0) return []
  const result: any[] = [rows[0]]
  for (let i = 1; i < rows.length; i++) {
    const curr = rows[i]
    const prev = rows[i - 1]
    const sameCity = curr.searched_city === prev.searched_city
    const sameDoctor = byDoctor
      ? (curr.doctor_id || '') === (prev.doctor_id || '')
      : true
    const withinWindow = Math.abs(new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()) <= 60000

    if (sameCity && sameDoctor && withinWindow) continue // skip duplicate
    result.push(curr)
  }
  return result
}

function toETDate(utcIso: string): string {
  const d = new Date(utcIso)
  return d.toLocaleDateString('en-CA', { timeZone: TZ }) // YYYY-MM-DD
}

function toETTimestamp(utcIso: string): string {
  const d = new Date(utcIso)
  return d.toLocaleString('en-US', { timeZone: TZ, hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

function etDateToUTCRange(etDate: string): string {
  // Convert ET midnight to UTC
  // During EDT (Mar-Nov): ET = UTC-4, so midnight ET = 04:00 UTC
  // During EST (Nov-Mar): ET = UTC-5, so midnight ET = 05:00 UTC
  // Use a safe approach: create date at noon ET then subtract to midnight
  const d = new Date(`${etDate}T12:00:00`)
  const utcNoon = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }))
  const etNoon = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  const offset = utcNoon.getTime() - etNoon.getTime()
  const midnight = new Date(`${etDate}T00:00:00`)
  return new Date(midnight.getTime() + offset).toISOString()
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}
