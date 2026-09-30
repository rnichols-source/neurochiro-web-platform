/**
 * Doctor-Joined Notification System
 *
 * Automated notification when a doctor is verified near waitlisted subscribers.
 * All safeguards are enforced here — the cron job and admin UI both call these functions.
 *
 * Kill switch: platform_settings.doctor_joined_notify.enabled (default: false)
 * Hold window: 24 hours (configurable)
 * Volume cap: 25 per doctor, 100 per day
 * Dedupe: doctor_notifications table with unique (doctor_id, subscriber_id, email_number)
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { haversineDistance } from '@/lib/geo'

// ── Types ──

export interface NotifySettings {
  enabled: boolean
  hold_hours: number
  max_per_doctor: number
  max_per_day: number
}

export interface QueuedNotification {
  id: string
  doctor_id: string
  status: string
  matched_subscribers: MatchedSubscriber[]
  matched_count: number
  send_after: string
  created_at: string
  processed_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  held_reason: string | null
  // Joined fields
  doctor_name?: string
  doctor_city?: string
  doctor_state?: string
}

export interface MatchedSubscriber {
  id: string
  email: string
  city: string
  state: string
  distance_miles: number
}

export interface LogEntry {
  id: string
  queue_id: string | null
  doctor_id: string
  subscriber_id: string
  email_number: number
  status: string
  suppression_reason: string | null
  distance_miles: number | null
  subscriber_city: string | null
  subscriber_state: string | null
  created_at: string
  resend_id: string | null
}

// ── Settings ──

const DEFAULT_SETTINGS: NotifySettings = {
  enabled: false,
  hold_hours: 24,
  max_per_doctor: 25,
  max_per_day: 100,
}

export async function getNotifySettings(): Promise<NotifySettings> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'doctor_joined_notify')
    .maybeSingle()
  if (!data?.value) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...data.value }
}

export async function updateNotifySettings(updates: Partial<NotifySettings>): Promise<void> {
  const supabase = createAdminClient()
  const current = await getNotifySettings()
  const merged = { ...current, ...updates }
  await (supabase as any)
    .from('platform_settings')
    .upsert({ key: 'doctor_joined_notify', value: merged, updated_at: new Date().toISOString() })
}

// ── Doctor eligibility checks ──

interface DoctorRecord {
  id: string
  first_name: string
  last_name: string
  clinic_name: string | null
  city: string
  state: string
  country: string | null
  slug: string
  latitude: number | null
  longitude: number | null
  verification_status: string
  verified_at: string | null
  photo_url: string | null
  created_at: string
  needs_review?: boolean
}

function isDoctorExcluded(doctor: DoctorRecord): string | null {
  if (doctor.verification_status !== 'verified') return 'not_verified'
  if (!doctor.latitude || !doctor.longitude) return 'no_coordinates'
  if (doctor.latitude === 0 && doctor.longitude === 0) return 'zero_coordinates'
  if (doctor.needs_review) return 'needs_review'
  // Incomplete profile: must have name, city, state, and slug
  if (!doctor.first_name || !doctor.last_name) return 'incomplete_name'
  if (!doctor.city || !doctor.state) return 'incomplete_location'
  if (!doctor.slug) return 'no_slug'
  return null
}

// ── Matching: find subscribers within 50mi of a doctor ──

export async function findMatchingSubscribers(
  doctorId: string
): Promise<{ doctor: DoctorRecord; matches: MatchedSubscriber[]; exclusionReason?: string }> {
  const supabase = createAdminClient()

  // Load doctor
  const { data: doctor } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, city, state, country, slug, latitude, longitude, verification_status, verified_at, photo_url, created_at, needs_review')
    .eq('id', doctorId)
    .single()

  if (!doctor) return { doctor: null as any, matches: [], exclusionReason: 'doctor_not_found' }

  const exclusion = isDoctorExcluded(doctor)
  if (exclusion) return { doctor, matches: [], exclusionReason: exclusion }

  const doctorCountry = doctor.country || 'US'
  const doctorLat = Number(doctor.latitude)
  const doctorLng = Number(doctor.longitude)

  // Load confirmed subscribers with coords, country-isolated
  let subQuery = (supabase as any)
    .from('subscribers')
    .select('id, email, zip, country')
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null)

  if (doctorCountry === 'US') {
    subQuery = subQuery.or('country.eq.US,country.is.null')
  } else {
    subQuery = subQuery.eq('country', doctorCountry)
  }

  const { data: subscribers } = await subQuery
  if (!subscribers || subscribers.length === 0) return { doctor, matches: [] }

  // Resolve subscriber ZIPs to coordinates
  const zips = new Set<string>()
  for (const s of subscribers) {
    const z = (s.zip || '').trim().slice(0, 5)
    if (z) zips.add(z)
  }

  if (zips.size === 0) return { doctor, matches: [] }

  const { data: zipCoords } = await (supabase as any)
    .from('zip_codes')
    .select('zip, city, state, lat, lng')
    .eq('country', doctorCountry)
    .in('zip', Array.from(zips))

  const zipMap = new Map<string, { city: string; state: string; lat: number; lng: number }>()
  for (const z of (zipCoords || [])) {
    zipMap.set(z.zip, { city: z.city, state: z.state, lat: Number(z.lat), lng: Number(z.lng) })
  }

  // Check already notified (email 1) for dedupe
  const subIds = subscribers.map((s: any) => s.id)
  const { data: alreadySent } = await (supabase as any)
    .from('doctor_notifications')
    .select('subscriber_id')
    .eq('doctor_id', doctorId)
    .eq('email_number', 1)
    .in('subscriber_id', subIds.length > 0 ? subIds : ['__none__'])

  const alreadySentSet = new Set((alreadySent || []).map((r: any) => r.subscriber_id))

  // Match within 50 miles
  const matches: MatchedSubscriber[] = []
  for (const sub of subscribers) {
    if (alreadySentSet.has(sub.id)) continue
    const z = (sub.zip || '').trim().slice(0, 5)
    const coord = zipMap.get(z)
    if (!coord) continue
    const dist = haversineDistance(doctorLat, doctorLng, coord.lat, coord.lng)
    if (dist <= 50) {
      matches.push({
        id: sub.id,
        email: sub.email,
        city: coord.city,
        state: coord.state,
        distance_miles: Math.round(dist * 10) / 10,
      })
    }
  }

  // Sort by distance
  matches.sort((a, b) => a.distance_miles - b.distance_miles)

  return { doctor, matches }
}

// ── Queue management ──

export async function enqueueDoctorNotification(
  doctorId: string,
  dryRun: boolean = false
): Promise<{
  queued: boolean
  queueId?: string
  matchedCount: number
  held?: boolean
  heldReason?: string
  dryRunMatches?: MatchedSubscriber[]
  exclusionReason?: string
}> {
  const settings = await getNotifySettings()
  const { doctor, matches, exclusionReason } = await findMatchingSubscribers(doctorId)

  if (exclusionReason) {
    return { queued: false, matchedCount: 0, exclusionReason }
  }

  if (matches.length === 0) {
    return { queued: false, matchedCount: 0 }
  }

  if (dryRun) {
    return { queued: false, matchedCount: matches.length, dryRunMatches: matches }
  }

  const supabase = createAdminClient()
  const sendAfter = new Date(Date.now() + settings.hold_hours * 60 * 60 * 1000)

  // Volume cap: hold if too many matches
  let status = 'pending'
  let heldReason: string | null = null

  if (matches.length > settings.max_per_doctor) {
    status = 'held'
    heldReason = `Matched ${matches.length} subscribers, exceeds cap of ${settings.max_per_doctor}. Review required.`
  }

  // Check daily volume
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const { data: todayQueued } = await (supabase as any)
    .from('doctor_notify_queue')
    .select('matched_count')
    .gte('created_at', todayStart.toISOString())
    .in('status', ['pending', 'processing', 'sent'])

  const todayTotal = (todayQueued || []).reduce((sum: number, q: any) => sum + q.matched_count, 0)
  if (todayTotal + matches.length > settings.max_per_day) {
    status = 'held'
    heldReason = `Daily total would be ${todayTotal + matches.length}, exceeds cap of ${settings.max_per_day}. Review required.`
  }

  // Insert queue entry
  const { data: queueEntry, error } = await (supabase as any)
    .from('doctor_notify_queue')
    .insert({
      doctor_id: doctorId,
      status,
      matched_subscribers: matches,
      matched_count: matches.length,
      send_after: sendAfter.toISOString(),
      held_reason: heldReason,
    })
    .select('id')
    .single()

  if (error) {
    // Unique index violation = already queued for this doctor
    if (error.code === '23505') {
      return { queued: false, matchedCount: matches.length, exclusionReason: 'already_queued' }
    }
    throw error
  }

  return {
    queued: true,
    queueId: queueEntry.id,
    matchedCount: matches.length,
    held: status === 'held',
    heldReason: heldReason || undefined,
  }
}

export async function cancelQueuedNotification(
  queueId: string,
  reason: string = 'Cancelled by admin'
): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('doctor_notify_queue')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason,
    })
    .eq('id', queueId)
    .in('status', ['pending', 'held'])

  return !error
}

export async function releaseHeldNotification(queueId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('doctor_notify_queue')
    .update({ status: 'pending', held_reason: null })
    .eq('id', queueId)
    .eq('status', 'held')

  return !error
}

// ── Queue listing for admin ──

export async function getNotifyQueue(): Promise<QueuedNotification[]> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('doctor_notify_queue')
    .select('*')
    .in('status', ['pending', 'held', 'processing'])
    .order('created_at', { ascending: false })

  if (!data || data.length === 0) return []

  // Join doctor names
  const doctorIds = data.map((q: any) => q.doctor_id)
  const { data: doctors } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state')
    .in('id', doctorIds)

  const docMap = new Map<string, any>()
  for (const d of (doctors || [])) docMap.set(d.id, d)

  return data.map((q: any) => {
    const doc = docMap.get(q.doctor_id)
    return {
      ...q,
      doctor_name: doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Unknown',
      doctor_city: doc?.city,
      doctor_state: doc?.state,
    }
  })
}

// ── Audit log queries ──

export async function getNotifyLog(filters?: {
  doctorId?: string
  subscriberId?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ entries: LogEntry[]; total: number }> {
  const supabase = createAdminClient()
  let query = (supabase as any)
    .from('doctor_notify_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId)
  if (filters?.subscriberId) query = query.eq('subscriber_id', filters.subscriberId)
  if (filters?.status) query = query.eq('status', filters.status)
  query = query.range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1)

  const { data, count } = await query
  return { entries: data || [], total: count || 0 }
}

export async function getNotifyStats(): Promise<{
  totalSent: number
  totalSuppressed: number
  totalContactRequests: number
  conversionRate: number
}> {
  const supabase = createAdminClient()

  const { count: sentCount } = await (supabase as any)
    .from('doctor_notify_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .eq('email_number', 1)

  const { count: suppressedCount } = await (supabase as any)
    .from('doctor_notify_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'suppressed')

  // Contact requests from doctor_joined source
  const { count: contactCount } = await (supabase as any)
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'doctor_joined')

  const totalSent = sentCount || 0
  const totalContactRequests = contactCount || 0
  const conversionRate = totalSent > 0 ? Math.round((totalContactRequests / totalSent) * 100) : 0

  return {
    totalSent,
    totalSuppressed: suppressedCount || 0,
    totalContactRequests,
    conversionRate,
  }
}

// ── Log helpers ──

export async function logNotification(entry: {
  queue_id?: string
  doctor_id: string
  subscriber_id: string
  email_number: number
  status: 'sent' | 'failed' | 'suppressed' | 'cancelled'
  suppression_reason?: string
  distance_miles?: number
  subscriber_city?: string
  subscriber_state?: string
  resend_id?: string
}): Promise<void> {
  const supabase = createAdminClient()
  await (supabase as any).from('doctor_notify_log').insert({
    queue_id: entry.queue_id || null,
    doctor_id: entry.doctor_id,
    subscriber_id: entry.subscriber_id,
    email_number: entry.email_number,
    status: entry.status,
    suppression_reason: entry.suppression_reason || null,
    distance_miles: entry.distance_miles || null,
    subscriber_city: entry.subscriber_city || null,
    subscriber_state: entry.subscriber_state || null,
    resend_id: entry.resend_id || null,
  })
}

// ── Find verified doctors that haven't been queued yet ──

export async function findUnqueuedVerifiedDoctors(): Promise<DoctorRecord[]> {
  const supabase = createAdminClient()

  // All verified doctors with valid coords
  const { data: doctors } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, city, state, country, slug, latitude, longitude, verification_status, verified_at, photo_url, created_at, needs_review')
    .eq('verification_status', 'verified')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .not('latitude', 'eq', 0)
    .not('longitude', 'eq', 0)

  if (!doctors || doctors.length === 0) return []

  // Exclude already queued (any status — we only queue once per doctor)
  const ids = doctors.map((d: any) => d.id)
  const { data: alreadyQueued } = await (supabase as any)
    .from('doctor_notify_queue')
    .select('doctor_id')
    .in('doctor_id', ids)

  const queuedSet = new Set((alreadyQueued || []).map((q: any) => q.doctor_id))

  // Also exclude doctors who have any notifications already sent (from the manual system)
  const { data: alreadyNotified } = await (supabase as any)
    .from('doctor_notifications')
    .select('doctor_id')
    .in('doctor_id', ids)

  const notifiedSet = new Set((alreadyNotified || []).map((n: any) => n.doctor_id))

  return doctors.filter((d: any) => !queuedSet.has(d.id) && !notifiedSet.has(d.id))
}
