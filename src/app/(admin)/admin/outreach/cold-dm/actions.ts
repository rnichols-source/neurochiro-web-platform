'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { fetchAllRows } from '@/lib/supabase-admin'
import { haversineDistance } from '@/lib/geo'
import { getThresholds } from '@/lib/thresholds'
import { revalidatePath } from 'next/cache'

// ── Types ──

export interface ParsedProspect {
  handle: string
  name: string
  location: string
  country?: string
}

export interface ProspectData {
  handle: string
  name: string
  location: string
  country: string
  lat: number | null
  lng: number | null
  city: string | null
  state: string | null
  geocode_failed: boolean
  already_sent: boolean
  local_30d: number
  metro_30d: number
  metro_90d: number
  metro_label: string
  state_90d: number
  tier: 'local' | 'metro' | 'metro_90' | 'state' | 'fallback'
  headline_number: number | null
  scope_label: string
  window_label: string
  covering_doctors: { name: string; city: string; distance: number }[]
  message: string
  template_used: string
}

// ── Templates ──

const OUTREACH_TEMPLATES: Record<string, string> = {
  short: `Hey Dr. [Name], came across your page.\n\nI run NeuroChiro. [X] people [scope_label] have asked me for a nervous system doc in the last [window] and I've had nobody to send them to.\n\nHere's how it works: [link]\n\nWorth a look if your schedule has room.`,

  tighter: `Hey Dr. [Name], came across your page and had to reach out.\n\nI'm Dr. Ray, I practice in Greer SC. I've been building NeuroChiro for the last couple years.\n\nShort version. I post about nervous system care to about 185k people and they comment their zip codes asking who I'd send them to. I route every single one by hand to the closest doctor in the network. [X] of those requests came from [scope_label] in the last [window] and I had nowhere to send them.\n\nThe doctors in it get routed patients, a profile built to convert, and access to the other docs for referrals when a patient relocates.\n\nEverything's here: [link]\n\nTake a look and tell me what you think. If it's not for you no hard feelings, but I wanted you to at least see it since your market keeps coming up.`,

  full: `Hey Dr. [Name], came across your page. Good to see another doc [scope_label] doing nervous system work.\n\nI'm Dr. Ray. I practice in Greer, South Carolina and I've spent the last couple years building NeuroChiro.\n\nHere's what it actually is. I have about 185k people following me and most of them have never been adjusted by someone who works the way we do. Every time I post, they comment their zip code asking who I'd send them to. Thousands of them. I read every one and I personally send them to the closest doctor in the network.\n\nIn the last [window], [X] people asked me for someone [scope_label]. I had nobody to send.\n\nThat's the whole thing. It's not a listing you sit on. It's me actively putting patients in front of you, plus a network of docs who refer to each other when someone moves or travels.\n\nIf you want to see it: [link]\n\nNo pressure either way. But [scope_label] has people asking and I'd rather send them to you than tell them I don't have anyone.`,

  fallback: `Hey Dr. [Name], came across your page.\n\nI'm Dr. Ray, I practice in Greer SC. I run NeuroChiro, a network of nervous system focused chiropractors.\n\nPeople comment their zip codes on my posts asking who I'd send them to and I route every one by hand to the closest doctor in the network. [State] is thin right now and I'd rather have someone there before the requests start coming in than after.\n\nHere's how it works: [link]\n\nWorth a look if you're open to it.`,
}

function fillTemplate(template: string, tokens: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value)
  }
  return result
}

function getProLink(country: string): string {
  switch (country) {
    case 'GB': return 'https://neurochiro.co/uk'
    case 'AU': return 'https://neurochiro.co/au'
    case 'CA': return 'https://neurochiro.co/ca'
    default: return 'https://neurochiro.co/pro'
  }
}

// ── Parse Prospects ──

export async function parseProspects(input: string): Promise<ParsedProspect[]> {
  await checkAdminAuth()
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
  const results: ParsedProspect[] = []

  for (const line of lines) {
    // Split by comma, tab, or pipe
    const parts = line.split(/[,\t|]/).map(p => p.trim()).filter(Boolean)

    let handle = ''
    let name = ''
    let location = ''

    for (const part of parts) {
      if (part.startsWith('@') || (!handle && /^[a-zA-Z0-9_.]+$/.test(part) && part.length <= 30 && parts.length > 1)) {
        handle = part.replace(/^@/, '').toLowerCase()
      } else if (!name && /^(dr\.?\s+)?[a-zA-Z]+ [a-zA-Z]+/i.test(part)) {
        name = part
      } else if (!location && (
        // ZIP code
        /^\d{5}$/.test(part) ||
        // City + state pattern
        /[a-zA-Z]+\s*,?\s*[A-Z]{2}$/i.test(part) ||
        // International postal
        /^[A-Z]\d[A-Z]/i.test(part) ||
        // General location fallback
        /[a-zA-Z]/.test(part)
      )) {
        if (!name && !handle) {
          name = part
        } else {
          location = part
        }
      } else if (!name) {
        name = part
      } else if (!location) {
        location = part
      }
    }

    // If only one part, try to extract handle
    if (parts.length === 1) {
      const single = parts[0]
      if (single.startsWith('@')) {
        handle = single.replace(/^@/, '').toLowerCase()
      } else {
        handle = single.toLowerCase()
      }
    }

    if (handle || name) {
      results.push({
        handle: handle || name.toLowerCase().replace(/\s+/g, ''),
        name: name || handle,
        location,
      })
    }
  }

  return results
}

// ── Compute Prospect Data ──

export async function computeProspectData(
  prospects: ParsedProspect[],
  templateKey: string = 'tighter',
): Promise<ProspectData[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const t = await getThresholds()

  // 1. Batch dedup check against outreach_logs
  const handles = prospects.map(p => p.handle.toLowerCase())
  const { data: existingLogs } = await (supabase as any)
    .from('outreach_logs')
    .select('rendered_body')
    .range(0, 0) // just checking structure
  // Actually check by prospect handle via outreach_prospects
  const sentHandles = new Set<string>()
  if (handles.length > 0) {
    const { data: sentProspects } = await (supabase as any)
      .from('outreach_prospects')
      .select('instagram_handle, status')
      .in('instagram_handle', handles)
      .in('status', ['contacted', 'replied', 'call_booked', 'call_held', 'joined', 'declined'])
    for (const sp of (sentProspects || [])) {
      if (sp.instagram_handle) sentHandles.add(sp.instagram_handle.toLowerCase())
    }
  }

  // 2. Load all demand mentions (paginated via fetchAllRows)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const allMentions = await fetchAllRows(
    supabase,
    'demand_mentions',
    'city, state, lat, lng, country, created_at',
  )

  // 3. Load all verified+pro doctors for coverage check
  const { data: allDoctors } = await (supabase as any)
    .from('doctors')
    .select('first_name, last_name, city, state, latitude, longitude, verification_status, membership_tier, country')
    .in('verification_status', ['verified', 'pending'])
    .eq('is_test', false)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .range(0, 4999) // intentional bound: all doctors

  const doctors = (allDoctors || []).filter((d: any) =>
    d.latitude && d.longitude && d.latitude !== 0 && d.longitude !== 0
  )

  // 4. Process each prospect
  const results: ProspectData[] = []

  for (const prospect of prospects) {
    const already_sent = sentHandles.has(prospect.handle.toLowerCase())

    // Geocode
    let lat: number | null = null
    let lng: number | null = null
    let city: string | null = null
    let state: string | null = null
    let country = prospect.country || 'US'
    let geocode_failed = false

    if (prospect.location) {
      try {
        const { detectPostalCode } = await import('@/lib/detect-postal')
        const postalDetection = detectPostalCode(prospect.location.trim(), country)
        const resolveCountry = postalDetection?.country || country

        const { resolveLocation } = await import('@/lib/resolve-city')
        const resolution = await resolveLocation(prospect.location, resolveCountry)

        if (resolution.resolved) {
          lat = resolution.resolved.lat
          lng = resolution.resolved.lng
          city = resolution.resolved.city
          state = resolution.resolved.state
          country = resolveCountry
        } else {
          geocode_failed = true
        }
      } catch {
        geocode_failed = true
      }
    } else {
      geocode_failed = true
    }

    // Demand tiers (only if geocoded)
    let local_30d = 0
    let metro_30d = 0
    let metro_90d = 0
    let metro_label = ''
    let state_90d = 0

    if (lat !== null && lng !== null) {
      const gapRadius = t.gap_radius // 50mi

      // Filter mentions by country
      const countryMentions = allMentions.filter((m: any) => (m.country || 'US') === country)

      // Local 30d: demand within 50mi in last 30 days
      const localMentions30d = countryMentions.filter((m: any) => {
        if (!m.lat || !m.lng) return false
        const mDate = new Date(m.created_at)
        if (mDate < thirtyDaysAgo) return false
        return haversineDistance(lat!, lng!, Number(m.lat), Number(m.lng)) <= gapRadius
      })
      local_30d = localMentions30d.length

      // Metro: group demand within 50mi by city, find the city with most mentions
      const cityGroups = new Map<string, { count: number; latSum: number; lngSum: number }>()
      const mentionsNear50 = countryMentions.filter((m: any) => {
        if (!m.lat || !m.lng) return false
        return haversineDistance(lat!, lng!, Number(m.lat), Number(m.lng)) <= gapRadius
      })

      for (const m of mentionsNear50) {
        const key = (m.city || 'Unknown').toLowerCase()
        const existing = cityGroups.get(key) || { count: 0, latSum: 0, lngSum: 0 }
        existing.count++
        existing.latSum += Number(m.lat)
        existing.lngSum += Number(m.lng)
        cityGroups.set(key, existing)
      }

      let metroCenter: { lat: number; lng: number } | null = null
      let maxCount = 0
      for (const [cityName, group] of cityGroups) {
        if (group.count > maxCount) {
          maxCount = group.count
          metro_label = cityName.charAt(0).toUpperCase() + cityName.slice(1)
          metroCenter = { lat: group.latSum / group.count, lng: group.lngSum / group.count }
        }
      }

      if (metroCenter) {
        // Metro 30d: demand within 30mi of metro center in last 30 days
        metro_30d = countryMentions.filter((m: any) => {
          if (!m.lat || !m.lng) return false
          const mDate = new Date(m.created_at)
          if (mDate < thirtyDaysAgo) return false
          return haversineDistance(metroCenter!.lat, metroCenter!.lng, Number(m.lat), Number(m.lng)) <= 30
        }).length

        // Metro 90d: demand within 30mi of metro center in last 90 days
        metro_90d = countryMentions.filter((m: any) => {
          if (!m.lat || !m.lng) return false
          const mDate = new Date(m.created_at)
          if (mDate < ninetyDaysAgo) return false
          return haversineDistance(metroCenter!.lat, metroCenter!.lng, Number(m.lat), Number(m.lng)) <= 30
        }).length
      }

      // State 90d: demand in same state in last 90 days
      if (state) {
        state_90d = countryMentions.filter((m: any) => {
          const mDate = new Date(m.created_at)
          if (mDate < ninetyDaysAgo) return false
          return (m.state || '').toUpperCase() === state!.toUpperCase()
        }).length
      }
    }

    // Headline number selection (tier walk)
    let tier: ProspectData['tier'] = 'fallback'
    let headline_number: number | null = null
    let scope_label = ''
    let window_label = ''

    if (local_30d >= 5) {
      tier = 'local'
      headline_number = local_30d
      scope_label = `in ${city || prospect.location}`
      window_label = '30 days'
    } else if (metro_30d >= 5) {
      tier = 'metro'
      headline_number = metro_30d
      scope_label = `across the ${metro_label} metro`
      window_label = '30 days'
    } else if (metro_90d >= 8) {
      tier = 'metro_90'
      headline_number = metro_90d
      scope_label = `across the ${metro_label} metro`
      window_label = '90 days'
    } else if (state_90d >= 10) {
      tier = 'state'
      headline_number = state_90d
      scope_label = `in ${state || ''}`
      window_label = '90 days'
    } else {
      tier = 'fallback'
      headline_number = null
      scope_label = ''
      window_label = ''
    }

    // Coverage check: verified+pro doctors within 30mi
    const covering_doctors: ProspectData['covering_doctors'] = []
    if (lat !== null && lng !== null) {
      const countryDocs = doctors.filter((d: any) => {
        const dc = d.country || 'US'
        return dc === country
      })
      for (const d of countryDocs) {
        const dist = haversineDistance(lat, lng, Number(d.latitude), Number(d.longitude))
        if (dist <= 30) {
          covering_doctors.push({
            name: `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim(),
            city: d.city || '',
            distance: Math.round(dist),
          })
        }
      }
      covering_doctors.sort((a, b) => a.distance - b.distance)
    }

    // Generate message
    let template_used = tier === 'fallback' ? 'fallback' : templateKey
    // If templateKey is not 'fallback' but tier is fallback, use fallback template
    const templateText = OUTREACH_TEMPLATES[template_used] || OUTREACH_TEMPLATES.tighter

    // Extract first name from prospect name
    const firstName = prospect.name
      .replace(/^dr\.?\s*/i, '')
      .split(/\s+/)[0] || prospect.name

    const link = getProLink(country)

    const tokens: Record<string, string> = {
      Name: firstName,
      X: headline_number !== null ? String(headline_number) : '',
      scope_label: scope_label,
      window: window_label,
      link: link,
      State: state || country,
    }

    const message = fillTemplate(templateText, tokens)

    results.push({
      handle: prospect.handle,
      name: prospect.name,
      location: prospect.location,
      country,
      lat,
      lng,
      city,
      state,
      geocode_failed,
      already_sent,
      local_30d,
      metro_30d,
      metro_90d,
      metro_label,
      state_90d,
      tier,
      headline_number,
      scope_label,
      window_label,
      covering_doctors,
      message,
      template_used,
    })
  }

  // Sort by metro_30d DESC
  results.sort((a, b) => b.metro_30d - a.metro_30d)

  return results
}

// ── Log Outreach (mark as sent) ──

export async function logColdDmOutreach(data: {
  handle: string
  name: string
  city: string | null
  state: string | null
  country: string
  lat: number | null
  lng: number | null
  template_used: string
  tier: string
  headline_number: number | null
  scope_label: string
  message: string
}): Promise<{ ok: boolean; error?: string }> {
  const user = await checkAdminAuth()
  const supabase = createAdminClient()

  // Upsert prospect
  const handleNormalized = data.handle.toLowerCase()
  const { data: existing } = await (supabase as any)
    .from('outreach_prospects')
    .select('id, status')
    .eq('instagram_handle', handleNormalized)
    .limit(1)

  let prospectId: string

  if (existing && existing.length > 0) {
    prospectId = existing[0].id
    // Update status if new
    if (existing[0].status === 'new') {
      await (supabase as any)
        .from('outreach_prospects')
        .update({ status: 'contacted', contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', prospectId)
    }
  } else {
    // Create prospect
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from('outreach_prospects')
      .insert({
        name: data.name,
        instagram_handle: handleNormalized,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: data.lat,
        longitude: data.lng,
        source: 'cold_dm',
        status: 'contacted',
        prospect_type: 'doctor',
        has_usable_location: data.lat != null && data.lng != null,
        contacted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertErr) return { ok: false, error: insertErr.message }
    prospectId = inserted.id
  }

  // Write outreach_logs
  const { error: logErr } = await (supabase as any)
    .from('outreach_logs')
    .insert({
      prospect_id: prospectId,
      channel: 'ig_dm',
      template_key: data.template_used,
      intent: 'cold_dm',
      rendered_body: data.message,
      operator: user.id,
      status_before: 'new',
      status_after: 'contacted',
      demand_snapshot: {
        tier: data.tier,
        headline_number: data.headline_number,
        scope_label: data.scope_label,
        city: data.city,
        state: data.state,
      },
    })

  if (logErr) return { ok: false, error: logErr.message }

  revalidatePath('/admin/outreach/cold-dm')
  return { ok: true }
}

// ── Get Outreach Stats ──

export async function getOutreachStats(): Promise<{
  total_sent: number
  reply_count: number
  join_count: number
  by_template: Record<string, { sent: number; replies: number; joins: number }>
}> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Count all cold DM outreach logs
  const logs = await fetchAllRows(
    supabase,
    'outreach_logs',
    'template_key, status_after',
    (q: any) => q.eq('intent', 'cold_dm'),
  )

  const total_sent = logs.length
  const reply_count = logs.filter((l: any) => l.status_after === 'replied').length
  const join_count = logs.filter((l: any) => l.status_after === 'joined').length

  const by_template: Record<string, { sent: number; replies: number; joins: number }> = {}
  for (const log of logs) {
    const key = log.template_key || 'unknown'
    if (!by_template[key]) by_template[key] = { sent: 0, replies: 0, joins: 0 }
    by_template[key].sent++
    if (log.status_after === 'replied') by_template[key].replies++
    if (log.status_after === 'joined') by_template[key].joins++
  }

  // Also count replies/joins from prospect status changes
  const { data: prospects } = await (supabase as any)
    .from('outreach_prospects')
    .select('status')
    .eq('source', 'cold_dm')
    .range(0, 4999) // intentional bound

  const actualReplies = (prospects || []).filter((p: any) =>
    ['replied', 'call_booked', 'call_held', 'joined'].includes(p.status)
  ).length
  const actualJoins = (prospects || []).filter((p: any) => p.status === 'joined').length

  return {
    total_sent,
    reply_count: Math.max(reply_count, actualReplies),
    join_count: Math.max(join_count, actualJoins),
    by_template,
  }
}

// ── Get Available Templates ──

export async function getAvailableTemplates(): Promise<{ key: string; label: string; preview: string }[]> {
  await checkAdminAuth()
  return Object.entries(OUTREACH_TEMPLATES).map(([key, body]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    preview: body.slice(0, 80) + '...',
  }))
}
