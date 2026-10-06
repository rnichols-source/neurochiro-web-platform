'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { haversineDistance } from '@/lib/geo'
import { extractInstagramHandle } from '@/lib/instagram'

// ── Types ──

export interface QueueItem {
  id: string
  city: string
  state: string
  country: string
  lat: number
  lng: number
  source: string
  post_ref: string | null
  mentioned_on: string | null
  status: string
  likely_already_worked: boolean
  assigned_to: string | null
  claimed_at: string | null
  // Computed
  tier: 1 | 2 | 3 | 4
  nearest_doctor: DoctorPick | null
  nearest_distance: number | null
}

export interface DoctorPick {
  id: string
  name: string
  clinicName: string | null
  city: string
  state: string
  handle: string | null
  slug: string
  profileUrl: string
  photoUrl: string | null
  hasBooking: boolean
  hasHours: boolean
  hasPhoto: boolean
  distanceMiles: number
  introCount30d: number
  pickReason: string
}

export interface WorkItem {
  mention: QueueItem
  recommendation: DoctorPick | null
  alternates: DoctorPick[]
  templatePath: 'standard' | 'far' | 'waitlist'
  templateReason: string
  filledComment: string
  filledDM: string
}

export interface QueueStats {
  unworked: number
  inProgress: number
  workedToday: number
  workedTodayByMe: number
  tier1: number
  tier2: number
  tier3: number
  tier4: number
  oldestUnworked: string | null
}

// ── Settings ──

async function getThresholds(): Promise<{ standard: number; waitlist: number; tiebreak: number; claimTimeout: number }> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'coverage_queue_rules')
    .maybeSingle()
  const defaults = { standard: 30, waitlist: 75, tiebreak: 5, claimTimeout: 30 }
  return data?.value ? { ...defaults, ...data.value } : defaults
}

// ── Queue loading ──

export async function getQueueStats(): Promise<QueueStats> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  const { data: all } = await (supabase as any)
    .from('demand_mentions')
    .select('id, status, assigned_to, claimed_at, lat, lng, country, worked_at, worked_by')

  const rows = all || []
  const now = Date.now()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Load doctors for tier calculation
  const { data: docs } = await (supabase as any)
    .from('doctors')
    .select('latitude, longitude, country')
    .eq('verification_status', 'verified')
    .eq('is_test', false)
    .not('latitude', 'is', null)
    .not('latitude', 'eq', 0)

  const thresholds = await getThresholds()
  const doctors = (docs || []).filter((d: any) => d.latitude && d.longitude)

  let tier1 = 0, tier2 = 0, tier3 = 0, tier4 = 0, unworked = 0, inProgress = 0
  let workedToday = 0, workedTodayByMe = 0
  let oldestUnworked: string | null = null

  for (const r of rows) {
    if (r.status === 'unworked') {
      unworked++
      // Release stale claims
      if (r.assigned_to && r.claimed_at) {
        const claimAge = (now - new Date(r.claimed_at).getTime()) / 60000
        if (claimAge > thresholds.claimTimeout) {
          // Will be released by the queue load
        }
      }
      // Tier
      const nearest = findNearestDoctorDistance(r.lat, r.lng, r.country || 'US', doctors)
      if (nearest === null) tier4++
      else if (nearest <= thresholds.standard) tier1++
      else if (nearest <= thresholds.waitlist) tier2++
      else tier3++

      if (!oldestUnworked || (r.mentioned_on && r.mentioned_on < oldestUnworked)) {
        oldestUnworked = r.mentioned_on || r.created_at
      }
    } else if (r.status === 'in_progress') {
      inProgress++
    }
    if (r.worked_at && new Date(r.worked_at) >= todayStart) {
      workedToday++
      if (r.worked_by === user.id) workedTodayByMe++
    }
  }

  return { unworked, inProgress, workedToday, workedTodayByMe, tier1, tier2, tier3, tier4, oldestUnworked }
}

export async function getQueueItems(limit: number = 50, offset: number = 0, filters?: {
  tier?: number
  state?: string
  country?: string
}): Promise<QueueItem[]> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()
  const thresholds = await getThresholds()

  // Release stale claims first
  const staleTime = new Date(Date.now() - thresholds.claimTimeout * 60000).toISOString()
  await (supabase as any)
    .from('demand_mentions')
    .update({ status: 'unworked', assigned_to: null, claimed_at: null })
    .eq('status', 'in_progress')
    .lt('claimed_at', staleTime)

  let query = (supabase as any)
    .from('demand_mentions')
    .select('id, city, state, country, lat, lng, source, post_ref, mentioned_on, status, likely_already_worked, assigned_to, claimed_at')
    .eq('status', 'unworked')
    .order('mentioned_on', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit * 3 - 1) // Over-fetch for tier sorting

  if (filters?.state) query = query.eq('state', filters.state)
  if (filters?.country) query = query.eq('country', filters.country)

  const { data } = await query
  if (!data || data.length === 0) return []

  // Load doctors for distance calc
  const { data: docs } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state, country, latitude, longitude, instagram_url, clinic_name, slug, photo_url, booking_url, hours')
    .eq('verification_status', 'verified')
    .eq('is_test', false)
    .not('latitude', 'is', null)
    .not('latitude', 'eq', 0)

  const doctors = docs || []

  // Compute tier and nearest for each item
  const items: QueueItem[] = data.map((r: any) => {
    const nearest = findNearestDoctor(r.lat, r.lng, r.country || 'US', doctors, thresholds)
    let tier: 1 | 2 | 3 | 4 = 4
    if (nearest) {
      if (nearest.distanceMiles <= thresholds.standard) tier = 1
      else if (nearest.distanceMiles <= thresholds.waitlist) tier = 2
      else tier = 3
    }
    if (filters?.tier && tier !== filters.tier) return null

    return {
      ...r,
      country: r.country || 'US',
      tier,
      nearest_doctor: nearest,
      nearest_distance: nearest?.distanceMiles ?? null,
    }
  }).filter(Boolean) as QueueItem[]

  // Sort by tier, then by mentioned_on
  items.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    const aDate = a.mentioned_on || '9999'
    const bDate = b.mentioned_on || '9999'
    return aDate.localeCompare(bDate)
  })

  return items.slice(0, limit)
}

// ── Claim and work ──

export async function claimItem(mentionId: string): Promise<{ success: boolean; error?: string }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()
  const thresholds = await getThresholds()

  // Check current state
  const { data: item } = await (supabase as any)
    .from('demand_mentions')
    .select('status, assigned_to, claimed_at')
    .eq('id', mentionId)
    .single()

  if (!item) return { success: false, error: 'Item not found' }

  if (item.status === 'in_progress' && item.assigned_to && item.assigned_to !== user.id) {
    const claimAge = (Date.now() - new Date(item.claimed_at).getTime()) / 60000
    if (claimAge < thresholds.claimTimeout) {
      return { success: false, error: `Already claimed by another operator ${Math.round(claimAge)} minutes ago` }
    }
  }

  if (item.status !== 'unworked' && item.status !== 'in_progress') {
    return { success: false, error: `Cannot claim: status is ${item.status}` }
  }

  const { error } = await (supabase as any)
    .from('demand_mentions')
    .update({ status: 'in_progress', assigned_to: user.id, claimed_at: new Date().toISOString() })
    .eq('id', mentionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getWorkItem(mentionId: string): Promise<WorkItem | null> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()
  const thresholds = await getThresholds()

  const { data: mention } = await (supabase as any)
    .from('demand_mentions')
    .select('*')
    .eq('id', mentionId)
    .single()

  if (!mention) return null

  // Load doctors
  const { data: docs } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state, country, latitude, longitude, instagram_url, clinic_name, slug, photo_url, booking_url, hours, phone, needs_review')
    .eq('verification_status', 'verified')
    .eq('is_test', false)
    .not('latitude', 'is', null)
    .not('latitude', 'eq', 0)

  const doctors = docs || []

  // Load intro counts (last 30 days)
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: intros } = await (supabase as any)
    .from('reply_logs')
    .select('doctor_id')
    .eq('template_id', 'sent_to_patient')
    .gte('created_at', since30d)
    .not('doctor_id', 'is', null)

  const introCounts = new Map<string, number>()
  for (const r of (intros || [])) {
    introCounts.set(r.doctor_id, (introCounts.get(r.doctor_id) || 0) + 1)
  }

  // Auto-pick with full rule
  const country = mention.country || 'US'
  const candidates = doctors
    .filter((d: any) => {
      const dc = d.country || 'US'
      if (country === 'US') { if (dc !== 'US' && dc !== null) return false }
      else { if (dc !== country) return false }
      if (d.needs_review) return false
      if (!d.slug) return false
      if (!d.phone && !d.booking_url) return false
      return true
    })
    .map((d: any) => {
      const dist = haversineDistance(mention.lat, mention.lng, Number(d.latitude), Number(d.longitude))
      const handle = extractInstagramHandle(d.instagram_url)
      return {
        id: d.id,
        name: `Dr. ${d.first_name} ${d.last_name}`,
        clinicName: d.clinic_name || null,
        city: d.city || '',
        state: d.state || '',
        handle,
        slug: d.slug,
        profileUrl: `https://neurochiro.co/directory/${d.slug}`,
        photoUrl: d.photo_url || null,
        hasBooking: !!d.booking_url,
        hasHours: !!d.hours,
        hasPhoto: !!d.photo_url,
        distanceMiles: Math.round(dist * 10) / 10,
        introCount30d: introCounts.get(d.id) || 0,
        pickReason: '',
      } as DoctorPick
    })
    .sort((a: DoctorPick, b: DoctorPick) => a.distanceMiles - b.distanceMiles)

  // Apply auto-pick rule
  let picked: DoctorPick | null = null
  let pickReason = ''

  if (candidates.length > 0) {
    picked = candidates[0]
    pickReason = `Closest verified doctor. ${picked!.distanceMiles} miles.`

    // Tiebreak within threshold.tiebreak miles
    const tiebreakCandidates = candidates.filter((c: DoctorPick) => c.distanceMiles <= picked!.distanceMiles + thresholds.tiebreak)
    if (tiebreakCandidates.length > 1) {
      // Prefer complete profile
      const complete = tiebreakCandidates.filter((c: DoctorPick) => c.hasPhoto && c.hasBooking && c.hasHours)
      if (complete.length > 0) {
        // Among complete, prefer fewer intros
        complete.sort((a: DoctorPick, b: DoctorPick) => a.introCount30d - b.introCount30d)
        picked = complete[0]
        pickReason = `Closest with complete profile. ${picked!.distanceMiles} miles. ${picked!.introCount30d} intros this month.`
      } else {
        // Among all tiebreak, prefer fewer intros
        tiebreakCandidates.sort((a: DoctorPick, b: DoctorPick) => a.introCount30d - b.introCount30d)
        picked = tiebreakCandidates[0]
        pickReason = `Closest doctor. ${picked!.distanceMiles} miles. Fewer recent intros than alternatives.`
      }
    }

    picked!.pickReason = pickReason
  }

  // Template path
  let templatePath: 'standard' | 'far' | 'waitlist' = 'waitlist'
  let templateReason = 'No doctor found within range. Using waitlist templates.'

  if (picked) {
    if (picked.distanceMiles <= thresholds.standard) {
      templatePath = 'standard'
      templateReason = `${picked.distanceMiles} miles. Under ${thresholds.standard}mi threshold. Standard templates.`
    } else if (picked.distanceMiles <= thresholds.waitlist) {
      templatePath = 'far'
      templateReason = `${picked.distanceMiles} miles. Over ${thresholds.standard}mi but under ${thresholds.waitlist}mi. Far distance templates.`
    } else {
      templatePath = 'waitlist'
      templateReason = `Nearest doctor is ${picked.distanceMiles} miles. Over ${thresholds.waitlist}mi threshold. Waitlist templates.`
      picked = null // Don't recommend
    }
  }

  // Load and fill templates
  const { data: templates } = await (supabase as any)
    .from('reply_templates')
    .select('id, body')

  const tplMap = new Map<string, string>()
  for (const t of (templates || [])) tplMap.set(t.id, t.body)

  const humanDistance = (miles: number): string => {
    if (miles <= 20) return String(Math.round(miles))
    return String(Math.round(miles / 5) * 5)
  }

  const fillVars: Record<string, string> = {
    city: mention.city || '',
    state: mention.state || '',
    handle: picked?.handle || '',
    doctor_name: picked?.name || '',
    doctor_city: picked?.city || '',
    profile_url: picked?.profileUrl || '',
    contact_request_url: picked ? `https://neurochiro.co/contact-request?doctor=${picked.slug}&source=dm_outreach` : '',
    distance: picked ? humanDistance(picked.distanceMiles) : '',
  }

  const fillTemplate = (body: string): string => {
    return body.replace(/\{(\w+)\}/g, (_, key) => fillVars[key] || `{${key}}`)
  }

  let commentTplId = templatePath === 'far' ? 'doctor_comment_far' : templatePath === 'standard' ? 'doctor_comment' : 'waitlist_comment'
  let dmTplId = templatePath === 'far' ? 'doctor_dm_far' : templatePath === 'standard' ? 'doctor_dm' : 'waitlist_dm'

  const filledComment = fillTemplate(tplMap.get(commentTplId) || '')
  const filledDM = fillTemplate(tplMap.get(dmTplId) || '')

  const alternates = candidates.slice(1, 4).map((c: DoctorPick) => ({ ...c, pickReason: '' }))

  return {
    mention: {
      id: mention.id,
      city: mention.city,
      state: mention.state,
      country: mention.country || 'US',
      lat: mention.lat,
      lng: mention.lng,
      source: mention.source,
      post_ref: mention.post_ref,
      mentioned_on: mention.mentioned_on,
      status: mention.status,
      likely_already_worked: mention.likely_already_worked,
      assigned_to: mention.assigned_to,
      claimed_at: mention.claimed_at,
      tier: 1,
      nearest_doctor: picked,
      nearest_distance: picked?.distanceMiles ?? null,
    },
    recommendation: picked,
    alternates,
    templatePath,
    templateReason,
    filledComment,
    filledDM,
  }
}

export async function markAsSent(
  mentionId: string,
  doctorId: string | null,
  distanceMiles: number | null,
  outcome: string,
  commentTemplateId: string,
  dmTemplateId: string,
  filledComment: string,
  filledDM: string,
  resolvedCity: string,
  resolvedState: string,
): Promise<{ success: boolean; nextId: string | null; error?: string }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  // Update demand mention
  const { error: updateErr } = await (supabase as any)
    .from('demand_mentions')
    .update({
      status: 'replied',
      worked_at: new Date().toISOString(),
      worked_by: user.id,
      outcome,
      resolved_doctor_id: doctorId,
      resolved_distance_mi: distanceMiles,
    })
    .eq('id', mentionId)

  if (updateErr) {
    return { success: false, nextId: null, error: `Failed to update demand mention: ${updateErr.message}` }
  }

  // Write reply_logs with resolved city (not search box text), operator, and demand_mention_id
  const logEntries = [
    { template_id: commentTemplateId, searched_city: resolvedCity, searched_state: resolvedState, doctor_id: doctorId, operator: user.id, demand_mention_id: mentionId },
    { template_id: dmTemplateId, searched_city: resolvedCity, searched_state: resolvedState, doctor_id: doctorId, operator: user.id, demand_mention_id: mentionId },
    { template_id: 'sent_to_patient', searched_city: resolvedCity, searched_state: resolvedState, doctor_id: doctorId, operator: user.id, demand_mention_id: mentionId },
  ]

  const { error: logErr } = await (supabase as any)
    .from('reply_logs')
    .insert(logEntries)

  if (logErr) {
    return { success: false, nextId: null, error: `Mention updated but reply_logs failed: ${logErr.message}. DO NOT mark as sent again.` }
  }

  // Get next item
  const nextItems = await getQueueItems(1)
  const nextId = nextItems.length > 0 ? nextItems[0].id : null

  return { success: true, nextId }
}

export async function escalateItem(mentionId: string, reason: string): Promise<{ success: boolean; nextId: string | null }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  await (supabase as any)
    .from('demand_mentions')
    .update({
      status: 'escalated',
      escalation_reason: reason,
      worked_at: new Date().toISOString(),
      worked_by: user.id,
    })
    .eq('id', mentionId)

  const nextItems = await getQueueItems(1)
  return { success: true, nextId: nextItems.length > 0 ? nextItems[0].id : null }
}

export async function skipItem(mentionId: string, reason: string): Promise<{ success: boolean; nextId: string | null }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  await (supabase as any)
    .from('demand_mentions')
    .update({
      status: 'skipped',
      skip_reason: reason,
      worked_at: new Date().toISOString(),
      worked_by: user.id,
    })
    .eq('id', mentionId)

  const nextItems = await getQueueItems(1)
  return { success: true, nextId: nextItems.length > 0 ? nextItems[0].id : null }
}

export async function releaseItem(mentionId: string): Promise<boolean> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('demand_mentions')
    .update({ status: 'unworked', assigned_to: null, claimed_at: null })
    .eq('id', mentionId)
  return !error
}

// ── Helpers ──

function findNearestDoctorDistance(lat: number, lng: number, country: string, doctors: any[]): number | null {
  let nearest: number | null = null
  for (const d of doctors) {
    const dc = d.country || 'US'
    if (country === 'US') { if (dc !== 'US' && dc !== null) continue }
    else { if (dc !== country) continue }
    const dist = haversineDistance(lat, lng, Number(d.latitude), Number(d.longitude))
    if (nearest === null || dist < nearest) nearest = dist
  }
  return nearest
}

function findNearestDoctor(lat: number, lng: number, country: string, doctors: any[], thresholds: any): DoctorPick | null {
  let nearest: DoctorPick | null = null
  let nearestDist = Infinity

  for (const d of doctors) {
    const dc = d.country || 'US'
    if (country === 'US') { if (dc !== 'US' && dc !== null) continue }
    else { if (dc !== country) continue }
    const dist = haversineDistance(lat, lng, Number(d.latitude), Number(d.longitude))
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = {
        id: d.id,
        name: `Dr. ${d.first_name} ${d.last_name}`,
        clinicName: d.clinic_name,
        city: d.city,
        state: d.state,
        handle: extractInstagramHandle(d.instagram_url),
        slug: d.slug,
        profileUrl: `https://neurochiro.co/directory/${d.slug}`,
        photoUrl: d.photo_url,
        hasBooking: !!d.booking_url,
        hasHours: !!d.hours,
        hasPhoto: !!d.photo_url,
        distanceMiles: Math.round(dist * 10) / 10,
        introCount30d: 0,
        pickReason: '',
      }
    }
  }
  return nearest
}
