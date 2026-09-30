'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

export interface ReplyLogEntry {
  id: string
  template_id: string
  searched_city: string | null
  searched_state: string | null
  doctor_id: string | null
  doctor_name: string | null
  doctor_city: string | null
  doctor_state: string | null
  doctor_tier: string | null
  created_at: string
}

export interface DoctorReferralRow {
  id: string
  name: string
  city: string
  state: string
  tier: string
  is_founding_member: boolean
  referral_count: number
  last_referral: string | null
}

export interface CityReplyRow {
  city: string
  state: string
  total_replies: number
  to_doctor: number
  to_waitlist: number
  demand_mentions: number
}

export interface ReferralStats {
  total: number
  last7: number
  last30: number
  toDoctor: number
  toDoctorFar: number
  toWaitlist: number
  distinctDoctors: number
  verifiedDoctors: number
  appointmentRequests: number
  contactRequests: number
  contactFromDm: number
  contactFromJoined: number
  dmLinksSent: number
}

const DOCTOR_TEMPLATES = new Set(['doctor_comment', 'doctor_dm', 'doctor_comment_far', 'doctor_dm_far', 'sent_to_patient'])
const WAITLIST_TEMPLATES = new Set(['waitlist_dm', 'waitlist_comment'])
const FAR_TEMPLATES = new Set(['doctor_comment_far', 'doctor_dm_far'])

export async function getReferralPageData(): Promise<{
  stats: ReferralStats
  byDoctor: DoctorReferralRow[]
  zeroDoctors: { id: string; name: string; city: string; state: string; tier: string }[]
  byCity: CityReplyRow[]
  log: ReplyLogEntry[]
}> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // All reply logs
  const { data: logs } = await (supabase as any)
    .from('reply_logs')
    .select('id, template_id, searched_city, searched_state, doctor_id, created_at')
    .order('created_at', { ascending: false })

  const allLogs = logs || []
  const now = Date.now()
  const day = 86400000

  // Stats
  const toDoctor = allLogs.filter((l: any) => DOCTOR_TEMPLATES.has(l.template_id)).length
  const toDoctorFar = allLogs.filter((l: any) => FAR_TEMPLATES.has(l.template_id)).length
  const toWaitlist = allLogs.filter((l: any) => WAITLIST_TEMPLATES.has(l.template_id)).length
  const last7 = allLogs.filter((l: any) => now - new Date(l.created_at).getTime() < 7 * day).length
  const last30 = allLogs.filter((l: any) => now - new Date(l.created_at).getTime() < 30 * day).length
  const distinctDoctorIds = new Set(allLogs.filter((l: any) => l.doctor_id).map((l: any) => l.doctor_id))
  const dmLinksSent = allLogs.filter((l: any) => l.template_id === 'contact_request_link').length

  // Contact requests and appointment requests
  const { data: contactReqs } = await (supabase as any).from('contact_requests').select('source')
  const cr = contactReqs || []
  const { count: appointmentRequests } = await (supabase as any).from('leads').select('id', { count: 'exact', head: true }).eq('source', 'appointment_request')

  // All verified doctors
  const { data: allDocs } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state, membership_tier, is_founding_member')
    .eq('verification_status', 'verified')
    .or('country.is.null,country.eq.US')
    .order('last_name')

  const docs = allDocs || []
  const docMap = new Map<string, typeof docs[0]>()
  for (const d of docs) docMap.set(d.id, d)

  // By doctor
  const refByDoctor = new Map<string, { count: number; last: string }>()
  for (const l of allLogs) {
    if (!l.doctor_id || !DOCTOR_TEMPLATES.has(l.template_id)) continue
    const existing = refByDoctor.get(l.doctor_id)
    if (existing) {
      existing.count++
      if (l.created_at > existing.last) existing.last = l.created_at
    } else {
      refByDoctor.set(l.doctor_id, { count: 1, last: l.created_at })
    }
  }

  const byDoctor: DoctorReferralRow[] = []
  const zeroDoctors: { id: string; name: string; city: string; state: string; tier: string }[] = []

  for (const d of docs) {
    const ref = refByDoctor.get(d.id)
    if (ref) {
      byDoctor.push({
        id: d.id,
        name: `Dr. ${d.first_name} ${d.last_name}`,
        city: d.city || '',
        state: d.state || '',
        tier: d.is_founding_member ? 'founder' : (d.membership_tier || 'free'),
        is_founding_member: d.is_founding_member || false,
        referral_count: ref.count,
        last_referral: ref.last,
      })
    } else {
      zeroDoctors.push({
        id: d.id,
        name: `Dr. ${d.first_name} ${d.last_name}`,
        city: d.city || '',
        state: d.state || '',
        tier: d.is_founding_member ? 'founder' : (d.membership_tier || 'free'),
      })
    }
  }
  byDoctor.sort((a, b) => b.referral_count - a.referral_count)

  // By city
  const cityMap = new Map<string, { total: number; toDoctor: number; toWaitlist: number }>()
  for (const l of allLogs) {
    const key = `${l.searched_city || 'Unknown'}|${l.searched_state || ''}`
    const existing = cityMap.get(key) || { total: 0, toDoctor: 0, toWaitlist: 0 }
    existing.total++
    if (DOCTOR_TEMPLATES.has(l.template_id)) existing.toDoctor++
    if (WAITLIST_TEMPLATES.has(l.template_id)) existing.toWaitlist++
    cityMap.set(key, existing)
  }

  // Get demand mention counts for comparison
  const { data: mentions } = await (supabase as any)
    .from('demand_mentions')
    .select('city, state')
    .or('country.eq.US,country.is.null')

  const mentionCounts = new Map<string, number>()
  for (const m of (mentions || [])) {
    const key = `${m.city}|${m.state}`
    mentionCounts.set(key, (mentionCounts.get(key) || 0) + 1)
  }

  const byCity: CityReplyRow[] = []
  // Include all cities from replies
  for (const [key, counts] of cityMap) {
    const [city, state] = key.split('|')
    byCity.push({
      city, state,
      total_replies: counts.total,
      to_doctor: counts.toDoctor,
      to_waitlist: counts.toWaitlist,
      demand_mentions: mentionCounts.get(key) || 0,
    })
  }
  // Also include cities with mentions but no replies (dropped balls)
  for (const [key, count] of mentionCounts) {
    if (!cityMap.has(key)) {
      const [city, state] = key.split('|')
      byCity.push({ city, state, total_replies: 0, to_doctor: 0, to_waitlist: 0, demand_mentions: count })
    }
  }
  byCity.sort((a, b) => b.demand_mentions - a.demand_mentions)

  // Full log with doctor names
  const log: ReplyLogEntry[] = allLogs.map((l: any) => {
    const doc = l.doctor_id ? docMap.get(l.doctor_id) : null
    return {
      ...l,
      doctor_name: doc ? `Dr. ${doc.first_name} ${doc.last_name}` : null,
      doctor_city: doc?.city || null,
      doctor_state: doc?.state || null,
      doctor_tier: doc ? (doc.is_founding_member ? 'founder' : doc.membership_tier) : null,
    }
  })

  return {
    stats: {
      total: allLogs.length,
      last7, last30,
      toDoctor, toDoctorFar, toWaitlist,
      distinctDoctors: distinctDoctorIds.size,
      verifiedDoctors: docs.length,
      appointmentRequests: appointmentRequests || 0,
      contactRequests: cr.length,
      contactFromDm: cr.filter((r: any) => r.source === 'dm_outreach').length,
      contactFromJoined: cr.filter((r: any) => r.source === 'doctor_joined').length,
      dmLinksSent,
    },
    byDoctor, zeroDoctors, byCity, log,
  }
}
