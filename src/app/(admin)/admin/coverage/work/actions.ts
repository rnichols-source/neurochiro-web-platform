'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { haversineDistance } from '@/lib/geo'
import { extractInstagramHandle } from '@/lib/instagram'

// ── Types ──

export interface LookupResult {
  success: true
  resolvedCity: string
  resolvedState: string
  resolvedCountry: string
  resolvedLat: number
  resolvedLng: number
  label: string
  isAmbiguous: false
  isFallback: boolean // geocoder fallback, not zip table
  doctor: DoctorPick | null
  alternates: DoctorPick[]
  templatePath: 'standard' | 'far' | 'waitlist'
  templateReason: string
  filledComment: string
  filledDM: string
  commentTemplateId: string
  dmTemplateId: string
}

export interface AmbiguousResult {
  success: true
  isAmbiguous: true
  label: string
  options: { city: string; state: string }[]
}

export interface FailedResult {
  success: false
  error: string
  preserveInput: true
}

export type WorkLookupResult = LookupResult | AmbiguousResult | FailedResult

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

export interface SessionStats {
  today: number
  todayByMe: number
}

// ── Settings ──

async function getThresholds(): Promise<{ standard: number; waitlist: number; tiebreak: number }> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'coverage_queue_rules')
    .maybeSingle()
  const defaults = { standard: 30, waitlist: 75, tiebreak: 5 }
  return data?.value ? { ...defaults, ...data.value } : defaults
}

// ── Core lookup ──

export async function workLookup(query: string, country: string = 'US'): Promise<WorkLookupResult> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const thresholds = await getThresholds()

  // Resolve location
  const { detectPostalCode } = await import('@/lib/detect-postal')
  const postalDetection = detectPostalCode(query.trim(), country)
  const resolveCountry = postalDetection?.country || country

  const { resolveLocation } = await import('@/lib/resolve-city')
  const resolution = await resolveLocation(query, resolveCountry)

  // Ambiguous
  if (resolution.ambiguous && resolution.ambiguous.length > 1) {
    return {
      success: true,
      isAmbiguous: true,
      label: resolution.label || `"${query}" exists in multiple states. Pick one:`,
      options: resolution.ambiguous.map((v: any) => ({ city: v.city, state: v.state })),
    }
  }

  // Failed
  if (!resolution.resolved) {
    return {
      success: false,
      error: resolution.label || `Couldn't find "${query}". Try a zip code instead.`,
      preserveInput: true,
    }
  }

  const { city, state, lat, lng } = resolution.resolved
  const isFallback = !!resolution.couldNotGeocode || !!(resolution as any).nominatimFallback

  // Load doctors with country isolation
  const { data: docs } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state, country, latitude, longitude, instagram_url, clinic_name, slug, photo_url, booking_url, hours, phone, needs_review')
    .eq('verification_status', 'verified')
    .eq('is_test', false)
    .not('latitude', 'is', null)
    .not('latitude', 'eq', 0)

  // Intro counts (30d)
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

  // Filter and rank doctors
  const candidates: DoctorPick[] = (docs || [])
    .filter((d: any) => {
      const dc = d.country || 'US'
      // Country isolation
      if (resolveCountry === 'US') { if (dc !== 'US' && dc !== null) return false }
      else { if (dc !== resolveCountry) return false }
      if (d.needs_review) return false
      if (!d.slug) return false
      if (!d.phone && !d.booking_url) return false
      return true
    })
    .map((d: any) => {
      const dist = haversineDistance(lat, lng, Number(d.latitude), Number(d.longitude))
      return {
        id: d.id,
        name: `Dr. ${d.first_name} ${d.last_name}`,
        clinicName: d.clinic_name || null,
        city: d.city || '',
        state: d.state || '',
        handle: extractInstagramHandle(d.instagram_url),
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

  // Auto-pick
  let picked: DoctorPick | null = null

  if (candidates.length > 0) {
    picked = candidates[0]
    let reason = `Closest verified doctor. ${picked.distanceMiles} miles.`

    const tiebreakPool = candidates.filter((c: DoctorPick) => c.distanceMiles <= picked!.distanceMiles + thresholds.tiebreak)
    if (tiebreakPool.length > 1) {
      const complete = tiebreakPool.filter((c: DoctorPick) => c.hasPhoto && c.hasBooking && c.hasHours)
      if (complete.length > 0) {
        complete.sort((a: DoctorPick, b: DoctorPick) => a.introCount30d - b.introCount30d)
        picked = complete[0]
        reason = `Closest with complete profile. ${picked.distanceMiles} miles. ${picked.introCount30d} intros this month.`
      } else {
        tiebreakPool.sort((a: DoctorPick, b: DoctorPick) => a.introCount30d - b.introCount30d)
        picked = tiebreakPool[0]
        reason = `Closest doctor. ${picked.distanceMiles} miles. Fewer recent intros.`
      }
    }
    if (picked.hasPhoto && picked.hasBooking && picked.hasHours) {
      reason += ' Complete profile.'
    }
    picked.pickReason = reason
  }

  // Template path
  let templatePath: 'standard' | 'far' | 'waitlist' = 'waitlist'
  let templateReason = `No doctor within ${thresholds.waitlist} miles. Waitlist templates.`

  if (picked) {
    if (picked.distanceMiles <= thresholds.standard) {
      templatePath = 'standard'
      templateReason = `Standard templates. Nearest doctor is ${picked.distanceMiles} miles, under the ${thresholds.standard} mile threshold.`
    } else if (picked.distanceMiles <= thresholds.waitlist) {
      templatePath = 'far'
      templateReason = `Far distance templates. Nearest doctor is ${picked.distanceMiles} miles, over the ${thresholds.standard} mile threshold.`
    } else {
      templatePath = 'waitlist'
      templateReason = `Waitlist templates. Nearest doctor is ${picked.distanceMiles} miles, over the ${thresholds.waitlist} mile threshold.`
      picked = null
    }
  }

  // Load and fill templates
  const { data: templates } = await (supabase as any)
    .from('reply_templates')
    .select('id, body')

  const tplMap = new Map<string, string>()
  for (const t of (templates || [])) tplMap.set(t.id, t.body)

  const humanDist = (miles: number): string => miles <= 20 ? String(Math.round(miles)) : String(Math.round(miles / 5) * 5)

  const vars: Record<string, string> = {
    city: picked?.city || city,
    state: picked?.state || state,
    handle: picked?.handle || '',
    doctor_name: picked?.name || '',
    doctor_city: picked?.city || '',
    profile_url: picked?.profileUrl || '',
    contact_request_url: picked ? `https://neurochiro.co/contact-request?doctor=${picked.slug}&source=dm_outreach` : '',
    distance: picked ? humanDist(picked.distanceMiles) : '',
  }
  const fill = (body: string) => body.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`)

  const commentId = templatePath === 'far' ? 'doctor_comment_far' : templatePath === 'standard' ? 'doctor_comment' : 'waitlist_comment'
  const dmId = templatePath === 'far' ? 'doctor_dm_far' : templatePath === 'standard' ? 'doctor_dm' : 'waitlist_dm'

  return {
    success: true,
    resolvedCity: city,
    resolvedState: state,
    resolvedCountry: resolveCountry,
    resolvedLat: lat,
    resolvedLng: lng,
    label: resolution.label || `${city}, ${state}`,
    isAmbiguous: false,
    isFallback,
    doctor: picked,
    alternates: candidates.filter((c: DoctorPick) => c.id !== picked?.id).slice(0, 3),
    templatePath,
    templateReason,
    filledComment: fill(tplMap.get(commentId) || ''),
    filledDM: fill(tplMap.get(dmId) || ''),
    commentTemplateId: commentId,
    dmTemplateId: dmId,
  }
}

// ── Mark sent (Phase 4) ──

export async function workMarkSent(params: {
  resolvedCity: string
  resolvedState: string
  resolvedCountry: string
  resolvedLat: number
  resolvedLng: number
  doctorId: string | null
  distanceMiles: number | null
  outcome: string
  commentTemplateId: string
  dmTemplateId: string
  instagramHandle: string | null
  copiedBoth: boolean
}): Promise<{ success: boolean; error?: string }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  // 1. Find or create demand mention
  let mentionId: string | null = null

  // Try to find an unworked mention for this exact city+state+country
  const { data: existing } = await (supabase as any)
    .from('demand_mentions')
    .select('id')
    .eq('status', 'unworked')
    .ilike('city', params.resolvedCity)
    .ilike('state', params.resolvedState)
    .eq('country', params.resolvedCountry)
    .order('mentioned_on', { ascending: true })
    .limit(1)

  if (existing && existing.length > 0) {
    mentionId = existing[0].id
    // Update it
    const { error: updateErr } = await (supabase as any)
      .from('demand_mentions')
      .update({
        status: 'replied',
        worked_at: new Date().toISOString(),
        worked_by: user.id,
        outcome: params.outcome,
        resolved_doctor_id: params.doctorId,
        resolved_distance_mi: params.distanceMiles,
        instagram_handle: params.instagramHandle || null,
        handle_source: params.instagramHandle ? 'live_reply' : null,
      })
      .eq('id', mentionId)

    if (updateErr) {
      return { success: false, error: `Failed to update demand mention: ${updateErr.message}` }
    }
  } else {
    // Create a new one
    const { data: created, error: createErr } = await (supabase as any)
      .from('demand_mentions')
      .insert({
        city: params.resolvedCity,
        state: params.resolvedState,
        country: params.resolvedCountry,
        lat: params.resolvedLat,
        lng: params.resolvedLng,
        source: 'live_reply',
        mentioned_on: new Date().toISOString().slice(0, 10),
        status: 'replied',
        worked_at: new Date().toISOString(),
        worked_by: user.id,
        outcome: params.outcome,
        resolved_doctor_id: params.doctorId,
        resolved_distance_mi: params.distanceMiles,
        instagram_handle: params.instagramHandle || null,
        handle_source: params.instagramHandle ? 'live_reply' : null,
      })
      .select('id')
      .single()

    if (createErr) {
      return { success: false, error: `Failed to create demand mention: ${createErr.message}` }
    }
    mentionId = created.id
  }

  // 2. Write reply_logs — resolved city, operator, demand_mention_id
  const logRows = [
    { template_id: params.commentTemplateId, searched_city: params.resolvedCity, searched_state: params.resolvedState, doctor_id: params.doctorId, operator: user.id, demand_mention_id: mentionId },
    { template_id: params.dmTemplateId, searched_city: params.resolvedCity, searched_state: params.resolvedState, doctor_id: params.doctorId, operator: user.id, demand_mention_id: mentionId },
    { template_id: 'sent_to_patient', searched_city: params.resolvedCity, searched_state: params.resolvedState, doctor_id: params.doctorId, operator: user.id, demand_mention_id: mentionId },
  ]

  const { error: logErr } = await (supabase as any)
    .from('reply_logs')
    .insert(logRows)

  if (logErr) {
    return { success: false, error: `Demand mention saved but reply_logs failed: ${logErr.message}. DO NOT mark sent again.` }
  }

  // 3. Update outreach_targets if handle matches
  if (params.instagramHandle) {
    const normalized = params.instagramHandle.replace(/^@/, '').toLowerCase().trim()
    if (normalized) {
      await (supabase as any)
        .from('outreach_targets')
        .update({
          status: 'dmed',
          dmed_at: new Date().toISOString(),
          dmed_by: user.id,
          outcome: params.outcome,
          resolved_doctor_id: params.doctorId,
          city: params.resolvedCity,
          state: params.resolvedState,
          country: params.resolvedCountry,
        })
        .eq('handle', normalized)
        .eq('status', 'unworked')
    }
  }

  return { success: true }
}

// ── Escalate ──

export async function workEscalate(params: {
  resolvedCity: string
  resolvedState: string
  resolvedCountry: string
  resolvedLat: number
  resolvedLng: number
  reason: string
  instagramHandle: string | null
}): Promise<{ success: boolean }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  await (supabase as any)
    .from('demand_mentions')
    .insert({
      city: params.resolvedCity,
      state: params.resolvedState,
      country: params.resolvedCountry,
      lat: params.resolvedLat,
      lng: params.resolvedLng,
      source: 'live_reply',
      mentioned_on: new Date().toISOString().slice(0, 10),
      status: 'escalated',
      escalation_reason: params.reason,
      worked_at: new Date().toISOString(),
      worked_by: user.id,
      instagram_handle: params.instagramHandle || null,
      handle_source: params.instagramHandle ? 'live_reply' : null,
    })

  return { success: true }
}

// ── Session stats ──

export async function getWorkSessionStats(): Promise<SessionStats> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await (supabase as any)
    .from('reply_logs')
    .select('operator')
    .eq('template_id', 'sent_to_patient')
    .gte('created_at', todayStart.toISOString())

  const rows = data || []
  return {
    today: rows.length,
    todayByMe: rows.filter((r: any) => r.operator === user.id).length,
  }
}
