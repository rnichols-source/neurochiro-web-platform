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
  follow_up: string
  template_used: string
  tier_error: boolean
}

// ── Config ──

const FOLLOWER_COUNT = '189k'

// ── Templates ──
// scope_label already carries its preposition: "in Huntersville", "across the Charlotte metro", "in North Carolina"
// Templates must NOT add another preposition before [scope_label].

const OUTREACH_TEMPLATES: Record<string, string> = {
  uncovered_short: `Hey Dr. [Name], quick one.\n\nI run NeuroChiro. I post about nervous system care to about [follower_count] people and they comment their zip codes asking who I'd send them to. [X] of those came [scope_label] in the last [window].\n\nI route every one by hand to the closest doctor in the network. [City] doesn't have anyone yet, so those people are getting sent somewhere else or nowhere.\n\nWant me to send you how it works?`,

  uncovered_full: `Hey Dr. [Name], came across your page. Looks like you're doing real nervous system work, which is why I'm reaching out.\n\nI'm Dr. Ray, I practice in Greer SC. A couple years ago I started posting about nervous system care and it got away from me a little. About [follower_count] people follow me now and every time I post, they comment their zip code asking who I'd send them to.\n\nI read every one of them. [X] came [scope_label] in the last [window].\n\nI built NeuroChiro so I'd have somewhere to send them. It's a network of nervous system focused docs and I personally route people to the closest one. It's not a listing you pay for and forget about. I'm actively putting patients in front of the doctors in it.\n\n[City] is open right now.\n\nWant me to send you how it works?`,

  covered: `Hey Dr. [Name], quick one.\n\nI run NeuroChiro. People comment their zip codes on my posts asking who I'd send them to and I route every one by hand. [X] came [scope_label] in the last [window].\n\nI've got [covering_count] doc[s] in that area already and they're getting a lot of these. [City] keeps coming up specifically and I'd rather have someone right there than keep routing people [covering_distance] miles out.\n\nWant me to send you how it works?`,

  no_number: `Hey Dr. [Name], came across your page.\n\nI'm Dr. Ray, I practice in Greer SC. I run NeuroChiro, a network of nervous system focused chiropractors. People comment their zip codes on my posts asking who I'd send them to and I route every one by hand to the closest doctor in the network.\n\n[State] is thin right now. I'd rather have someone there before the requests start than scramble after.\n\nWant me to send you how it works?`,

  follow_up: `Appreciate it. Here's everything: [country_link]\n\nShort version. You get a profile built to convert, I route patients to you by hand, and you get access to the other docs in the network for referrals when a patient moves or travels.\n\n[X] people [scope_label] are already asking. Happy to answer anything.`,
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
        // Pre-process: resolve full state names to codes (e.g. "North Carolina" -> "NC")
        const { resolveStateCode } = await import('@/lib/resolve-state')
        let normalizedLocation = prospect.location.trim()
        const locationParts = normalizedLocation.split(/[,\s]+/)
        // Check if the last 1-2 words are a full state name
        for (let words = 3; words >= 1; words--) {
          if (locationParts.length > words) {
            const candidate = locationParts.slice(-words).join(' ')
            const stateCode = resolveStateCode(candidate, country)
            if (stateCode && stateCode.length === 2) {
              normalizedLocation = locationParts.slice(0, -words).join(' ') + ', ' + stateCode
              break
            }
          }
        }

        const { detectPostalCode } = await import('@/lib/detect-postal')
        const postalDetection = detectPostalCode(normalizedLocation, country)
        const resolveCountry = postalDetection?.country || country

        const { resolveLocation } = await import('@/lib/resolve-city')
        const resolution = await resolveLocation(normalizedLocation, resolveCountry)

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
    let tier_error = false

    if (lat !== null && lng !== null) {
      const LOCAL_RADIUS = 10 // miles — tight, just the town
      const METRO_RADIUS = 30 // miles — the metro area the practice draws from

      // Filter mentions by country
      const countryMentions = allMentions.filter((m: any) => (m.country || 'US') === country)

      // Pre-compute distances from prospect point for all mentions
      const mentionsWithDist = countryMentions
        .filter((m: any) => m.lat && m.lng)
        .map((m: any) => ({
          ...m,
          dist: haversineDistance(lat!, lng!, Number(m.lat), Number(m.lng)),
          date: new Date(m.created_at),
        }))

      // Local 30d: demand within 10mi in last 30 days (tight, just the town)
      local_30d = mentionsWithDist.filter(m => m.dist <= LOCAL_RADIUS && m.date >= thirtyDaysAgo).length

      // Metro: find the largest demand city within 50mi to use as metro label,
      // then count everything within METRO_RADIUS of the prospect point.
      // Metro uses the prospect point, not the metro center, so it always contains local.
      const mentionsNear50 = mentionsWithDist.filter(m => m.dist <= 50)
      const cityGroups = new Map<string, number>()
      for (const m of mentionsNear50) {
        const key = (m.city || 'Unknown').toLowerCase()
        cityGroups.set(key, (cityGroups.get(key) || 0) + 1)
      }

      // Find the largest city for the metro label
      let maxCount = 0
      for (const [cityName, count] of cityGroups) {
        if (count > maxCount && cityName !== (city || '').toLowerCase()) {
          maxCount = count
          metro_label = cityName.charAt(0).toUpperCase() + cityName.slice(1)
        }
      }
      // If the prospect's own city is the largest, use it
      if (!metro_label) {
        metro_label = city || ''
      }

      // Metro 30d: demand within METRO_RADIUS of the prospect in last 30 days
      // This always >= local because METRO_RADIUS > LOCAL_RADIUS and same center point
      metro_30d = mentionsWithDist.filter(m => m.dist <= METRO_RADIUS && m.date >= thirtyDaysAgo).length

      // Metro 90d: demand within METRO_RADIUS of the prospect in last 90 days
      metro_90d = mentionsWithDist.filter(m => m.dist <= METRO_RADIUS && m.date >= ninetyDaysAgo).length

      // State 90d: demand in same state in last 90 days
      if (state) {
        state_90d = countryMentions.filter((m: any) => {
          const mDate = new Date(m.created_at)
          if (mDate < ninetyDaysAgo) return false
          return (m.state || '').toUpperCase() === state!.toUpperCase()
        }).length
      }

      // Invariant checks: each tier must be >= the one inside it
      tier_error = metro_30d < local_30d || state_90d < metro_90d
    }

    // Headline number selection: pick the LARGEST number that clears its credibility floor.
    // scope_label carries its own preposition for templates.
    let tier: ProspectData['tier'] = 'fallback'
    let headline_number: number | null = null
    let scope_label = ''
    let window_label = ''

    // Tier ladder: prefer tighter geography. Walk from most specific to least.
    // Pick the first tier where the number clears its credibility floor.
    // A doctor in Huntersville cares more about "55 across the Charlotte metro"
    // than "183 in North Carolina" even though 183 is bigger.
    const candidates: { tier: ProspectData['tier']; n: number; scope: string; window: string; min: number }[] = [
      { tier: 'local',    n: local_30d, scope: `in ${city || prospect.location}`,           window: '30 days', min: 8 },
      { tier: 'metro',    n: metro_30d, scope: `across the ${metro_label} metro`,            window: '30 days', min: 8 },
      { tier: 'metro_90', n: metro_90d, scope: `across the ${metro_label} metro`,            window: '90 days', min: 15 },
      { tier: 'state',    n: state_90d, scope: `in ${state || ''}`,                          window: '90 days', min: 25 },
    ]

    // Pick the candidate with the highest n among those that clear their minimum.
    // The minimums act as credibility floors per geography. Higher minimums on
    // broader geographies mean they only win when local/metro are thin.
    const qualifying = candidates.filter(c => c.n >= c.min)
    if (qualifying.length > 0) {
      const chosen = qualifying.reduce((best, c) => c.n > best.n ? c : best)
      tier = chosen.tier
      headline_number = chosen.n
      scope_label = chosen.scope
      window_label = chosen.window
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
    // Template selection: covered if doctors exist, no_number if fallback, else user's choice
    let template_used = tier === 'fallback' ? 'no_number'
      : covering_doctors.length > 0 ? 'covered'
      : templateKey
    const templateText = OUTREACH_TEMPLATES[template_used] || OUTREACH_TEMPLATES.uncovered_short

    // Extract first name from prospect name
    const firstName = prospect.name
      .replace(/^dr\.?\s*/i, '')
      .split(/\s+/)[0] || prospect.name

    const countryLink = getProLink(country)
    const coveringCount = covering_doctors.length
    const nearestDist = covering_doctors.length > 0 ? covering_doctors[0].distance : 0
    const docPlural = coveringCount === 1 ? '' : 's'

    const tokens: Record<string, string> = {
      Name: firstName,
      follower_count: FOLLOWER_COUNT,
      X: headline_number !== null ? String(headline_number) : '',
      scope_label: scope_label,
      window: window_label,
      country_link: countryLink,
      City: city || prospect.location,
      Metro: metro_label,
      State: state || country,
      covering_count: String(coveringCount),
      covering_distance: String(nearestDist),
      's': docPlural,
    }

    const message = fillTemplate(templateText, tokens)
    const follow_up = fillTemplate(OUTREACH_TEMPLATES.follow_up, tokens)

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
      message: tier_error ? '' : message,
      follow_up: tier_error ? '' : follow_up,
      template_used: tier_error ? 'error' : template_used,
      tier_error,
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
