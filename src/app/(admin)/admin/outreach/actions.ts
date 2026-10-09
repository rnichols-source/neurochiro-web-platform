'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { haversineDistance, boundingBox, isValidCoord } from '@/lib/geo'
import { extractInstagramHandle } from '@/lib/instagram'
import { resolveLocation } from '@/lib/resolve-city'
import { revalidatePath } from 'next/cache'

// ── Voice Validator ──

export async function validateTemplate(text: string): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  if (/\u2014/.test(text)) errors.push('Contains em dash (\u2014). Use commas or periods instead.')
  if (/\u2013/.test(text)) errors.push('Contains en dash (\u2013). Use a hyphen instead.')
  if (/being straight with you/i.test(text)) errors.push('Contains "being straight with you"')
  if (/\bguarantee[d]?\b/i.test(text)) errors.push('Contains "guarantee/guaranteed"')
  if (/\bROI\b/.test(text)) errors.push('Contains "ROI"')
  if (/\bexclusi(ve|vity)\b/i.test(text)) errors.push('Contains "exclusive/exclusivity"')
  if (/patients per month/i.test(text)) errors.push('Contains "patients per month"')
  if (/we'll fill your schedule/i.test(text)) errors.push('Contains "we\'ll fill your schedule"')
  if (/double your/i.test(text)) errors.push('Contains "double your"')
  if (/\d+\s*new patients/i.test(text)) errors.push('Contains number + "new patients"')

  if (/!/.test(text)) warnings.push('Contains exclamation point(s)')
  // Uncontracted forms — warn, not block
  const uncontracted = [
    [/\bI am\b/, "I am → I'm"], [/\bhere is\b/i, "here is → here's"],
    [/\bdo not\b/i, "do not → don't"], [/\bcannot\b/i, "cannot → can't"],
    [/\bit is\b/i, "it is → it's"], [/\bthat is\b/i, "that is → that's"],
    [/\bare not\b/i, "are not → aren't"], [/\bis not\b/i, "is not → isn't"],
    [/\byou are\b/i, "you are → you're"], [/\bthere is\b/i, "there is → there's"],
    [/\bwill not\b/i, "will not → won't"], [/\bwould not\b/i, "would not → wouldn't"],
  ] as const
  for (const [re, label] of uncontracted) {
    if (re.test(text)) warnings.push(`Uncontracted: ${label}`)
  }
  const wordCount = text.split(/\s+/).length
  if (wordCount > 120) warnings.push(`${wordCount} words (over 120 for ig_dm)`)
  if (text.length > 320) warnings.push(`${text.length} chars (over 320 for sms)`)

  return { errors, warnings }
}

// ── Search Prospects ──

export async function searchProspects(query: string, prospectType: string = 'doctor') {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  const q = `%${query}%`

  let prospectQuery = db
    .from('outreach_prospects' as any)
    .select('*')
    .or(`name.ilike.${q},clinic_name.ilike.${q},city.ilike.${q},instagram_handle.ilike.${q},email.ilike.${q}`)
    .limit(20)
  if (prospectType) prospectQuery = prospectQuery.eq('prospect_type', prospectType)
  const { data: prospects } = await prospectQuery

  const { data: members } = await db
    .from('doctors' as any)
    .select('id, first_name, last_name, clinic_name, city, state, email, instagram_url, slug')
    .or(`first_name.ilike.${q},last_name.ilike.${q},clinic_name.ilike.${q},instagram_url.ilike.${q},email.ilike.${q}`)
    .limit(20)

  return { prospects: prospects || [], members: members || [] }
}

// ── Get Single Prospect ──

export async function getProspect(id: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  const { data, error } = await db.from('outreach_prospects' as any).select('*').eq('id', id).single()
  if (error) return null
  return data as any
}

// ── Add Prospect ──

export async function addProspect(data: {
  name: string; first_name?: string; clinic_name?: string; city: string;
  state?: string; country?: string; postal_code?: string;
  instagram_handle?: string; email?: string; phone?: string; website?: string;
  source?: string; source_detail?: string; notes?: string;
}) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  // Duplicate check
  const duplicates: any[] = []
  if (data.email) {
    const { data: d1 } = await db.from('outreach_prospects' as any).select('id, name, email').ilike('email', data.email).limit(3)
    if (d1?.length) duplicates.push(...d1.map((d: any) => ({ ...d, source: 'prospect' })))
    const { data: d2 } = await db.from('doctors' as any).select('id, first_name, last_name, email').ilike('email', data.email).limit(3)
    if (d2?.length) duplicates.push(...d2.map((d: any) => ({ ...d, name: `${d.first_name} ${d.last_name}`, source: 'member' })))
  }
  if (data.instagram_handle) {
    const handle = data.instagram_handle.replace('@', '')
    const { data: d3 } = await db.from('outreach_prospects' as any).select('id, name, instagram_handle').ilike('instagram_handle', `%${handle}%`).limit(3)
    if (d3?.length) duplicates.push(...d3.map((d: any) => ({ ...d, source: 'prospect' })))
    const { data: d4 } = await db.from('doctors' as any).select('id, first_name, last_name, instagram_url').ilike('instagram_url', `%${handle}%`).limit(3)
    if (d4?.length) duplicates.push(...d4.map((d: any) => ({ ...d, name: `${d.first_name} ${d.last_name}`, source: 'member' })))
  }
  if (data.city) {
    const { data: d5 } = await db.from('outreach_prospects' as any).select('id, name, city').ilike('name', data.name).ilike('city', data.city).limit(3)
    if (d5?.length) duplicates.push(...d5.map((d: any) => ({ ...d, source: 'prospect' })))
  }

  // Resolve coordinates
  let lat: number | null = null
  let lng: number | null = null
  const locInput = data.postal_code || (data.city && data.state ? `${data.city}, ${data.state}` : data.city)
  if (locInput) {
    const res = await resolveLocation(locInput, data.country || 'US')
    if (res.resolved) { lat = res.resolved.lat; lng = res.resolved.lng }
  }

  const { data: prospect, error } = await db.from('outreach_prospects' as any).insert({
    name: data.name,
    first_name: data.first_name || null,
    clinic_name: data.clinic_name || null,
    city: data.city,
    state: data.state || null,
    country: data.country || 'US',
    postal_code: data.postal_code || null,
    latitude: lat, longitude: lng,
    instagram_handle: data.instagram_handle || null,
    email: data.email || null,
    phone: data.phone || null,
    website: data.website || null,
    source: data.source || 'manual',
    source_detail: data.source_detail || null,
    notes: data.notes || null,
    status: 'new',
  }).select().single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/outreach')
  return { success: true, prospect, duplicates: duplicates.length ? duplicates : undefined }
}

// ── Get Outreach Config ──

export async function getOutreachConfig() {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  const { data } = await db.from('platform_settings' as any).select('value').eq('key', 'doctor_outreach').single()
  return (data as any)?.value || {}
}

// ── Get Templates ──

export async function getTemplatesForChannel(channel: string, intent?: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  let query = db.from('outreach_templates' as any).select('*').eq('channel', channel).eq('active', true)
  if (intent) query = query.eq('intent', intent)
  const { data } = await query.order('intent').order('key')
  return data || []
}

// ── Demand for Prospect ──

export async function getDemandForProspect(prospectId: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const { data: prospect } = await db.from('outreach_prospects' as any).select('*').eq('id', prospectId).single()
  if (!prospect) return null
  const p = prospect as any

  // Load demand source filter from config
  const configResult = await db.from('platform_settings' as any).select('value').eq('key', 'doctor_outreach').single()
  const outreachConfig = (configResult.data as any)?.value || {}
  const demandSources: string[] = outreachConfig.demand_sources || ['instagram', 'instagram_comment']

  let lat = p.latitude ? Number(p.latitude) : null
  let lng = p.longitude ? Number(p.longitude) : null

  // Try to resolve if missing
  if (!isValidCoord(lat, lng) && p.city) {
    const locInput = p.postal_code || `${p.city}${p.state ? ', ' + p.state : ''}`
    const res = await resolveLocation(locInput, p.country || 'US')
    if (res.resolved) {
      lat = res.resolved.lat; lng = res.resolved.lng
      await db.from('outreach_prospects' as any).update({ latitude: lat, longitude: lng, updated_at: new Date().toISOString() }).eq('id', prospectId)
    }
  }

  // City+state exact match, filtered by configured sources
  let demandCity = 0
  if (p.city && p.state) {
    const { count } = await db.from('demand_mentions' as any).select('*', { count: 'exact', head: true }).ilike('city', p.city).eq('state', p.state).in('source', demandSources)
    demandCity = count || 0
  }

  // Total demand, filtered by configured sources
  const { count: totalDemand } = await db.from('demand_mentions' as any).select('*', { count: 'exact', head: true }).in('source', demandSources)

  let demand25 = 0, demand50 = 0, demand100 = 0
  let nearestDist: number | null = null, nearestCity = '', nearestName = ''

  if (isValidCoord(lat, lng)) {
    // Radius demand counts using bounding box pre-filter + haversine
    const [minLng100, minLat100, maxLng100, maxLat100] = boundingBox(lat!, lng!, 100)
    const { data: mentions } = await db.from('demand_mentions' as any).select('lat, lng')
      .in('source', demandSources)
      .gte('lat', minLat100).lte('lat', maxLat100)
      .gte('lng', minLng100).lte('lng', maxLng100)

    for (const m of (mentions || []) as any[]) {
      const mLat = Number(m.lat), mLng = Number(m.lng)
      if (!isValidCoord(mLat, mLng)) continue
      const dist = haversineDistance(lat!, lng!, mLat, mLng)
      if (dist <= 25) demand25++
      if (dist <= 50) demand50++
      if (dist <= 100) demand100++
    }

    // Nearest active member
    const [mMinLng, mMinLat, mMaxLng, mMaxLat] = boundingBox(lat!, lng!, 200)
    const { data: docs } = await db.from('doctors' as any)
      .select('first_name, last_name, city, latitude, longitude')
      .eq('membership_tier', 'pro').not('verified_at', 'is', null).eq('is_test', false)
      .gte('latitude', mMinLat).lte('latitude', mMaxLat)
      .gte('longitude', mMinLng).lte('longitude', mMaxLng)

    let minDist = Infinity
    for (const d of (docs || []) as any[]) {
      const dLat = Number(d.latitude), dLng = Number(d.longitude)
      if (!isValidCoord(dLat, dLng)) continue
      const dist = haversineDistance(lat!, lng!, dLat, dLng)
      if (dist < minDist) {
        minDist = dist
        nearestDist = Math.round(dist)
        nearestCity = (d as any).city || ''
        nearestName = `${(d as any).first_name || ''} ${(d as any).last_name || ''}`.trim()
      }
    }

    // If no member within 200mi, check all
    if (nearestDist === null) {
      const { data: allDocs } = await db.from('doctors' as any)
        .select('first_name, last_name, city, latitude, longitude')
        .eq('membership_tier', 'pro').not('verified_at', 'is', null).eq('is_test', false)
      for (const d of (allDocs || []) as any[]) {
        const dLat = Number(d.latitude), dLng = Number(d.longitude)
        if (!isValidCoord(dLat, dLng)) continue
        const dist = haversineDistance(lat!, lng!, dLat, dLng)
        if (dist < (nearestDist ?? Infinity)) {
          nearestDist = Math.round(dist)
          nearestCity = (d as any).city || ''
          nearestName = `${(d as any).first_name || ''} ${(d as any).last_name || ''}`.trim()
        }
      }
    }
  }

  return {
    demand_city: demandCity, demand_25mi: demand25, demand_50mi: demand50, demand_100mi: demand100,
    nearest_member_distance: nearestDist, nearest_member_city: nearestCity, nearest_member_name: nearestName,
    is_uncovered: nearestDist === null || nearestDist > 50,
    total_demand: totalDemand || 0,
    prospect_lat: lat, prospect_lng: lng,
  }
}

// ── Render Template ──

export async function renderTemplate(templateKey: string, prospectId: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const { data: template } = await db.from('outreach_templates' as any).select('*').eq('key', templateKey).single()
  if (!template) return { blocked: true, missing: ['template not found'], rendered: null }
  const t = template as any

  const { data: prospect } = await db.from('outreach_prospects' as any).select('*').eq('id', prospectId).single()
  if (!prospect) return { blocked: true, missing: ['prospect not found'], rendered: null }
  const p = prospect as any

  const configResult = await db.from('platform_settings' as any).select('value').eq('key', 'doctor_outreach').single()
  const config = (configResult.data as any)?.value || {}

  const demand = await getDemandForProspect(prospectId)

  // Get operator name — strip "Dr." prefix to get first name
  const { data: profile } = await db.from('profiles' as any).select('full_name').eq('id', user.id).single()
  const fullName = ((profile as any)?.full_name || 'Dr. Ray').replace(/^Dr\.?\s*/i, '')
  const operatorFirstName = fullName.split(' ')[0] || 'Ray'

  // Build slug-based profile link
  const profileLink = p.slug ? `https://neurochiro.co/directory/${p.slug}` : ''

  const handle = p.instagram_handle ? (p.instagram_handle.startsWith('@') ? p.instagram_handle : `@${p.instagram_handle}`) : ''

  // Pluralization helper
  const pl = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

  const demandCity = demand?.demand_city || 0
  const demand25 = demand?.demand_25mi || 0
  const demand50 = demand?.demand_50mi || 0
  const demand100 = demand?.demand_100mi || 0
  const totalDemand = demand?.total_demand || 0

  const vars: Record<string, string> = {
    first_name: p.first_name || '',
    name: p.name || '',
    clinic_name: p.clinic_name || '',
    city: p.city || '',
    state: p.state || '',
    handle,
    demand_city: `${demandCity} ${demandCity === 1 ? 'person' : 'people'}`,
    demand_25mi: `${demand25} ${demand25 === 1 ? 'person' : 'people'}`,
    demand_50mi: `${demand50} ${demand50 === 1 ? 'person' : 'people'}`,
    demand_100mi: `${demand100} ${demand100 === 1 ? 'person' : 'people'}`,
    nearest_member_distance: String(Math.round(demand?.nearest_member_distance || 0)),
    nearest_member_city: demand?.nearest_member_city || '',
    is_uncovered: demand?.is_uncovered ? 'true' : 'false',
    calendly_link: config.calendly_url || '',
    sales_page_link: config.sales_page_url || '',
    operator_first_name: operatorFirstName,
    total_demand: pl(totalDemand, 'request'),
    profile_link: profileLink,
  }

  // Check required variables
  const required: string[] = t.required_variables || []
  const missing = required.filter(v => {
    const val = vars[v]
    return val === null || val === undefined || val === ''
  })
  if (missing.length > 0) return { blocked: true, missing, rendered: null }

  // Demand floor check: block if a demand variable is required and below the floor
  const demandFloor = config.demand_floor || 3
  const demandVarValues: Record<string, number> = {
    demand_city: demandCity, demand_25mi: demand25, demand_50mi: demand50, demand_100mi: demand100
  }
  for (const rv of required) {
    if (rv in demandVarValues && demandVarValues[rv] < demandFloor && demandVarValues[rv] > 0) {
      return {
        blocked: true,
        missing: [`Only ${demandVarValues[rv]} ${rv === 'demand_city' ? 'in ' + p.city : 'within ' + rv.replace('demand_', '')}. Not enough to lead with.`],
        rendered: null,
      }
    }
    if (rv in demandVarValues && demandVarValues[rv] === 0) {
      return {
        blocked: true,
        missing: [`Zero demand ${rv === 'demand_city' ? 'in ' + p.city : 'within ' + rv.replace('demand_', '')}. Cannot send this template.`],
        rendered: null,
      }
    }
  }

  // Coverage-based template blocking
  // city_led = claims nobody is nearby, only allowed in gaps (>75mi)
  // thin_coverage = acknowledges a distant member, allowed in thin (30-75mi)
  const gapThreshold = config.gap_threshold || 75
  const thinThreshold = config.thin_threshold || 30
  const memberDist = demand?.nearest_member_distance ?? Infinity

  if (t.intent === 'city_led' && memberDist <= gapThreshold) {
    return {
      blocked: true,
      missing: [`${demand?.nearest_member_name || 'A member'} is ${Math.round(memberDist)} miles away in ${demand?.nearest_member_city || 'the area'}. Use thin_coverage template instead, or first_contact.`],
      rendered: null,
    }
  }
  if (t.intent === 'thin_coverage' && memberDist <= thinThreshold) {
    return {
      blocked: true,
      missing: [`${demand?.nearest_member_name || 'A member'} is only ${Math.round(memberDist)} miles away in ${demand?.nearest_member_city || 'the area'}. Area is covered, not thin.`],
      rendered: null,
    }
  }

  // Substitute
  let rendered = t.body as string
  for (const [k, v] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
  }

  let subject: string | undefined
  if (t.subject) {
    subject = t.subject as string
    for (const [k, v] of Object.entries(vars)) {
      subject = subject.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    }
  }

  // Voice validation — check both body and subject
  const textToValidate = subject ? `${subject}\n${rendered}` : rendered
  const validation = await validateTemplate(textToValidate)
  const warnings = [...validation.warnings]
  if (validation.errors.length) {
    warnings.push(...validation.errors.map(e => `VOICE: ${e}`))
  }

  const demandSnapshot = demand ? {
    demand_city: demand.demand_city, demand_25mi: demand.demand_25mi,
    demand_50mi: demand.demand_50mi, demand_100mi: demand.demand_100mi,
    nearest_member_distance: demand.nearest_member_distance,
    is_uncovered: demand.is_uncovered, total_demand: demand.total_demand,
  } : null

  return {
    blocked: false, rendered, subject,
    demandSnapshot, warnings: warnings.length ? warnings : undefined,
  }
}

// ── Log Outreach ──

export async function logOutreach(data: {
  prospectId: string; channel: string; templateKey: string; intent: string;
  renderedBody: string; demandSnapshot?: any; statusAfter?: string;
}) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const { data: prospect } = await db.from('outreach_prospects' as any).select('status').eq('id', data.prospectId).single()
  const statusBefore = (prospect as any)?.status || 'new'

  await db.from('outreach_logs' as any).insert({
    prospect_id: data.prospectId,
    channel: data.channel,
    template_key: data.templateKey,
    intent: data.intent,
    rendered_body: data.renderedBody,
    operator: user.id,
    status_before: statusBefore,
    status_after: data.statusAfter || statusBefore,
    demand_snapshot: data.demandSnapshot || null,
  })

  if (data.statusAfter && data.statusAfter !== statusBefore) {
    const updates: any = { status: data.statusAfter, updated_at: new Date().toISOString() }

    if (data.statusAfter === 'contacted') {
      const configResult = await db.from('platform_settings' as any).select('value').eq('key', 'doctor_outreach').single()
      const config = (configResult.data as any)?.value || {}
      const days = config.follow_up_days?.first || 5
      const { data: cur } = await db.from('outreach_prospects' as any).select('next_follow_up_at').eq('id', data.prospectId).single()
      if (!(cur as any)?.next_follow_up_at) {
        const followUp = new Date()
        followUp.setDate(followUp.getDate() + days)
        updates.next_follow_up_at = followUp.toISOString()
      }
    }

    await db.from('outreach_prospects' as any).update(updates).eq('id', data.prospectId)
  }

  revalidatePath('/admin/outreach')
  return { success: true }
}

// ── Log Outcome ──

export async function logOutcome(data: {
  prospectId: string; outcome: 'replied' | 'call_booked' | 'call_held' | 'no_response' | 'declined';
}) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const { data: prospect } = await db.from('outreach_prospects' as any).select('status').eq('id', data.prospectId).single()
  const statusBefore = (prospect as any)?.status || 'contacted'

  const configResult = await db.from('platform_settings' as any).select('value').eq('key', 'doctor_outreach').single()
  const config = (configResult.data as any)?.value || {}
  const followUpDays = config.follow_up_days || { first: 3, second: 7, re_engage: 14, post_call: 2 }

  let statusAfter = statusBefore
  let nextFollowUp: string | null = null
  const now = new Date()

  switch (data.outcome) {
    case 'replied':
      statusAfter = 'replied'
      nextFollowUp = now.toISOString() // same day, hottest state in pipeline
      break
    case 'call_booked':
      statusAfter = 'call_booked'
      nextFollowUp = null // no follow-up needed until after call
      break
    case 'call_held':
      statusAfter = 'call_held'
      nextFollowUp = new Date(now.getTime() + followUpDays.post_call * 86400000).toISOString()
      break
    case 'no_response':
      // Stay at current status, set next follow-up
      nextFollowUp = new Date(now.getTime() + followUpDays.second * 86400000).toISOString()
      break
    case 'declined':
      statusAfter = 'declined'
      nextFollowUp = null
      break
  }

  // Write log row
  await db.from('outreach_logs' as any).insert({
    prospect_id: data.prospectId,
    channel: 'system',
    template_key: `outcome_${data.outcome}`,
    intent: 'outcome',
    rendered_body: `Outcome: ${data.outcome}`,
    operator: user.id,
    status_before: statusBefore,
    status_after: statusAfter,
  })

  // Update prospect
  const updates: any = { status: statusAfter, updated_at: now.toISOString() }
  if (nextFollowUp !== null) updates.next_follow_up_at = nextFollowUp
  else if (data.outcome === 'call_booked' || data.outcome === 'declined') updates.next_follow_up_at = null

  await db.from('outreach_prospects' as any).update(updates).eq('id', data.prospectId)

  revalidatePath('/admin/outreach')
  return { success: true, statusAfter }
}

// ── Get Last Contact Info (for collision detection) ──

export async function getLastContact(prospectId: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const { data } = await db.from('outreach_logs' as any)
    .select('operator, channel, intent, created_at')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data?.length) return null

  const log = data[0] as any
  const isMe = log.operator === user.id
  const daysAgo = Math.floor((Date.now() - new Date(log.created_at).getTime()) / 86400000)

  // Get operator name
  let operatorName = 'Unknown'
  if (log.operator) {
    const { data: profile } = await db.from('profiles' as any).select('full_name').eq('id', log.operator).single()
    if (profile) operatorName = (profile as any).full_name || 'Unknown'
  }

  return { operator: log.operator, operatorName, isMe, daysAgo, channel: log.channel, intent: log.intent, at: log.created_at }
}

// ── Set Follow-Up Date ──

export async function setFollowUpDate(prospectId: string, date: string | null) {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  await db.from('outreach_prospects' as any).update({
    next_follow_up_at: date,
    updated_at: new Date().toISOString(),
  }).eq('id', prospectId)
  revalidatePath('/admin/outreach')
  return { success: true }
}

// ── Bulk Add Prospects ──

export async function bulkAddProspects(prospects: Array<{
  name: string; first_name?: string; clinic_name?: string; city: string;
  state?: string; country?: string; postal_code?: string;
  instagram_handle?: string; email?: string; phone?: string; website?: string;
  facebook?: string; source?: string; source_detail?: string;
  prospect_type?: string; notes?: string;
}>) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const rows = prospects.map(p => ({
    name: (p.name || '').trim(),
    first_name: p.first_name?.trim() || null,
    clinic_name: p.clinic_name?.trim() || null,
    city: (p.city || '').trim(),
    state: p.state?.trim() || null,
    country: p.country?.trim() || 'US',
    postal_code: p.postal_code?.trim() || null,
    instagram_handle: p.instagram_handle?.trim() || null,
    email: p.email?.trim() || null,
    phone: p.phone?.trim() || null,
    website: p.website?.trim() || null,
    facebook: p.facebook?.trim() || null,
    source: p.source?.trim() || 'csv_import',
    source_detail: p.source_detail?.trim() || null,
    prospect_type: p.prospect_type?.trim() || 'doctor',
    notes: p.notes?.trim() || null,
    status: 'new' as const,
  }))

  const { error, data } = await db.from('outreach_prospects' as any).insert(rows).select()
  if (error) return { success: false, error: error.message, count: 0 }

  revalidatePath('/admin/outreach')
  return { success: true, count: data?.length || 0 }
}

// ── Update Prospect ──

export async function updateProspect(id: string, data: Record<string, any>) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const coordFieldChanged = data.city !== undefined || data.state !== undefined || data.postal_code !== undefined
  if (coordFieldChanged) {
    const { data: existing } = await db.from('outreach_prospects' as any).select('city, state, postal_code, country').eq('id', id).single()
    const e = existing as any
    const city = data.city ?? e?.city
    const state = data.state ?? e?.state
    const postalCode = data.postal_code ?? e?.postal_code
    const country = data.country ?? e?.country ?? 'US'
    const locInput = postalCode || (city && state ? `${city}, ${state}` : city)
    if (locInput) {
      const res = await resolveLocation(locInput, country)
      if (res.resolved) {
        data.latitude = res.resolved.lat
        data.longitude = res.resolved.lng
      }
    }
  }

  const { error } = await db.from('outreach_prospects' as any)
    .update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/outreach')
  return { success: true }
}

// ── Delete Prospect ──

export async function deleteProspect(id: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  const { error } = await db.from('outreach_prospects' as any).delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/outreach')
  return { success: true }
}

// ── Get Prospects (Paginated) ──

export async function getProspects(options: {
  status?: string; search?: string; state?: string;
  prospect_type?: string; page?: number; limit?: number;
} = {}) {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  const { status, search, state, prospect_type, page = 1, limit = 50 } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = db.from('outreach_prospects' as any).select('*', { count: 'exact' })
  if (status && status !== 'all') query = query.eq('status', status)
  if (state && state !== 'all') query = query.eq('state', state)
  if (prospect_type && prospect_type !== 'all') query = query.eq('prospect_type', prospect_type)
  if (search) {
    const q = `%${search}%`
    query = query.or(`name.ilike.${q},clinic_name.ilike.${q},city.ilike.${q},instagram_handle.ilike.${q},email.ilike.${q}`)
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) return { prospects: [], total: 0, hasMore: false }

  return { prospects: (data || []) as any[], total: count || 0, hasMore: (count || 0) > to + 1 }
}

// ── Queue (demand-sorted) ──

export async function getQueue(options: {
  prospect_type?: string; status?: string; limit?: number;
} = {}) {
  const user = await checkAdminAuth()
  const db = createAdminClient()
  const { prospect_type = 'doctor', status = 'new', limit: maxRows = 100 } = options

  // Get config
  const configResult = await db.from('platform_settings' as any).select('value').eq('key', 'doctor_outreach').single()
  const config = (configResult.data as any)?.value || {}
  const demandFloor = config.demand_floor || 3

  const thinThreshold = config.thin_threshold || 30 // covered below this
  const gapThreshold = config.gap_threshold || 75  // gap above this, thin between

  // Get prospects with coords and usable location, must have at least one contact method
  let query = db.from('outreach_prospects' as any).select('*')
    .eq('has_usable_location', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .eq('is_existing_member', false)
  if (status === 'follow_up') {
    query = query.in('status', ['contacted', 'replied', 'call_booked', 'call_held'])
      .not('next_follow_up_at', 'is', null)
      .lte('next_follow_up_at', new Date().toISOString())
  } else if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (prospect_type && prospect_type !== 'all') query = query.eq('prospect_type', prospect_type)
  const { data: prospects } = await query.limit(500)
  if (!prospects?.length) return []

  // Filter out prospects with no reachable channel
  const reachable = (prospects as any[]).filter(p =>
    (p.instagram_handle && p.instagram_handle !== '') ||
    (p.email && p.email !== '') ||
    (p.phone && p.phone !== '')
  )

  // Get all demand mentions (filtered by configured sources) + all pro members
  const demandSources: string[] = config.demand_sources || ['instagram', 'instagram_comment']
  const { data: mentions } = await db.from('demand_mentions' as any).select('lat, lng')
    .in('source', demandSources)
    .not('lat', 'is', null).not('lng', 'is', null)
  const allMentions = (mentions || []) as unknown as { lat: number; lng: number }[]

  const { data: members } = await db.from('doctors' as any)
    .select('first_name, last_name, city, state, latitude, longitude')
    .eq('membership_tier', 'pro').not('verified_at', 'is', null).eq('is_test', false)
    .not('latitude', 'is', null)
  const allMembers = (members || []) as unknown as { first_name: string; last_name: string; city: string; state: string; latitude: number; longitude: number }[]

  // Compute demand_50mi + nearest member for each prospect
  const enriched = reachable.map(p => {
    const pLat = Number(p.latitude), pLng = Number(p.longitude)

    let demand50 = 0
    for (const m of allMentions) {
      if (haversineDistance(pLat, pLng, Number(m.lat), Number(m.lng)) <= 50) demand50++
    }

    let nearestDist = Infinity, nearestName = '', nearestCity = ''
    for (const mem of allMembers) {
      const mLat = Number(mem.latitude), mLng = Number(mem.longitude)
      if (!mLat || !mLng) continue
      const d = haversineDistance(pLat, pLng, mLat, mLng)
      if (d < nearestDist) {
        nearestDist = d
        nearestName = `${mem.first_name} ${mem.last_name}`.trim()
        nearestCity = `${mem.city}, ${mem.state}`
      }
    }

    // Coverage tier: gap (>75mi), thin (30-75mi), covered (<30mi)
    const coverage_tier = nearestDist > gapThreshold ? 'gap' : nearestDist > thinThreshold ? 'thin' : 'covered'
    return {
      ...p,
      demand_50mi: demand50,
      nearest_member_name: nearestName,
      nearest_member_city: nearestCity,
      nearest_member_distance: nearestDist, // full precision, no rounding
      coverage_tier,
      is_uncovered: coverage_tier !== 'covered',
    }
  })

  // Filter by demand floor for new prospects
  const filtered = status === 'new'
    ? enriched.filter(p => p.demand_50mi >= demandFloor)
    : enriched

  // Sort: demand descending, tier is a label not a sort key
  filtered.sort((a, b) => {
    if (status === 'follow_up') {
      const aT = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Infinity
      const bT = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Infinity
      if (aT !== bT) return aT - bT
    }
    return b.demand_50mi - a.demand_50mi
  })

  // Group by metro: city+state. Surface strongest candidate per metro, rest collapsed.
  const metroMap = new Map<string, any[]>()
  for (const p of filtered) {
    const key = `${(p.city || '').toLowerCase()}|${(p.state || '').toLowerCase()}`
    if (!metroMap.has(key)) metroMap.set(key, [])
    metroMap.get(key)!.push(p)
  }

  const result: any[] = []
  for (const [metro, group] of metroMap) {
    // Sort group by demand descending, pick the one with the most contact methods as tiebreak
    group.sort((a: any, b: any) => {
      if (b.demand_50mi !== a.demand_50mi) return b.demand_50mi - a.demand_50mi
      const contactScore = (p: any) => (p.instagram_handle ? 1 : 0) + (p.email ? 1 : 0) + (p.phone ? 1 : 0)
      return contactScore(b) - contactScore(a)
    })
    const top = { ...group[0], metro_count: group.length, metro_others: group.slice(1).map((p: any) => ({ id: p.id, name: p.name, instagram_handle: p.instagram_handle, email: p.email, phone: p.phone })) }
    result.push(top)
  }

  // Re-sort metro leaders: demand descending, tier is label only
  result.sort((a, b) => {
    if (status === 'follow_up') {
      const aT = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Infinity
      const bT = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Infinity
      if (aT !== bT) return aT - bT
    }
    return b.demand_50mi - a.demand_50mi
  })

  return result.slice(0, maxRows)
}

// ── Pipeline Stats ──

export async function getPipelineStats(prospect_type?: string) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  let query = db.from('outreach_prospects' as any).select('status')
  if (prospect_type && prospect_type !== 'all') query = query.eq('prospect_type', prospect_type)
  const { data } = await query

  const statuses = (data || []).map((d: any) => d.status)
  const counts: Record<string, number> = {}
  for (const s of statuses) {
    counts[s] = (counts[s] || 0) + 1
  }
  counts.total = statuses.length
  return counts
}
