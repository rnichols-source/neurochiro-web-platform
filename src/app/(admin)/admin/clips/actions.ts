'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { extractInstagramHandle } from '@/lib/instagram'

// ── Types ──

export interface DoctorOption {
  id: string
  name: string
  city: string
  state: string
  handle: string | null
  clinicName: string | null
  slug: string
  profileUrl: string
}

export interface GeneratedCaptions {
  hooks: [string, string, string]
  on_screen_text: string
  instagram_caption: string
  tiktok_caption: string
  youtube_title: string
  youtube_description: string
}

export interface ClipCaption {
  id: string
  doctor_id: string
  doctor_name?: string
  doctor_city?: string
  transcript: string
  topic: string | null
  clip_length: string | null
  generated: GeneratedCaptions | null
  hook_selected: string | null
  status: string
  created_by: string | null
  approved_at: string | null
  created_at: string
}

// ── Doctor list for selector ──

export async function getDoctorsForClips(): Promise<DoctorOption[]> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  const { data } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state, instagram_url, clinic_name, slug')
    .eq('verification_status', 'verified')
    .eq('is_test', false)
    .order('last_name')

  return (data || []).map((d: any) => ({
    id: d.id,
    name: `Dr. ${d.first_name} ${d.last_name}`,
    city: d.city || '',
    state: d.state || '',
    handle: extractInstagramHandle(d.instagram_url),
    clinicName: d.clinic_name || null,
    slug: d.slug,
    profileUrl: `https://neurochiro.co/directory/${d.slug}`,
  }))
}

// ── Generate captions ──

const SYSTEM_PROMPT = `You write social media captions for Dr. Raymond Nichols, a chiropractor with 185,000 Instagram followers who educates the public about nervous system focused chiropractic care. He runs NeuroChiro, a directory of chiropractors he has personally vetted, at neurochiro.co.

You are given a transcript from a short interview clip with one of the directory's member doctors. You write the captions that will accompany that clip on Instagram Reels, TikTok, and YouTube Shorts.

**Voice**

Direct and plain-spoken. No hype. No marketing language. No exclamation points. Short sentences. Write the way a person talks, not the way an ad reads. The only emoji you may use is 👊 and only sparingly.

**Absolute formatting rule**

Never use an em dash or an en dash. Not once. Use periods and commas instead. This is the single most important formatting rule you have.

**Phrases that are forbidden**

"being straight with you", "game changer", "life changing", "transform your health", "book now", "don't miss out", "limited spots", "unlock", "secret", "doctors don't want you to know".

**Claims**

Use only what is actually in the transcript. Never invent a quote, a statistic, or a claim the doctor did not make. Never promise outcomes, results, or cures. Never imply urgency or scarcity. Never give medical advice in the caption.

**Attribution on outcome stories**

When a transcript contains a patient result or outcome, the caption must attribute it clearly to the doctor telling the story. Write "Dr. Smith said his patient told him..." rather than stating the result as a general claim. Never let a single patient's result read as a typical or expected outcome. One person's experience is one person's experience.

**What every caption must do**

1. Say what the clip is actually about, in plain language.
2. Route local people to this specific doctor, in the shape of "If you're in {city}, {handle} is who I'd send you to."
3. Give everyone else the standing call to action: comment your city and Dr. Ray will find them someone.

**Platform requirements**

Instagram Reels: The hook is the first line. The doctor's handle must appear within the first 125 characters, because that is all that shows before the caption is cut off. Body of two to four short lines. Call to action at the end. Then 5 to 8 hashtags on their own lines at the bottom.

TikTok: Shorter than Instagram. TikTok search runs on caption text, so the caption must contain the literal phrases people type into search, such as "nervous system chiropractor", "chiropractor near me", and the doctor's city name. 4 to 6 hashtags inline at the end.

YouTube Shorts title: 100 characters maximum, keyword forward, descriptive rather than clever. Someone searching for this topic should find it. No clickbait.

YouTube Shorts description: Two or three lines. Include the doctor's profile URL and neurochiro.co. The closing line should be a proper sentence or question, not a fragment.

Hooks: exactly three options, each under 10 words, each one a different angle on the clip. You must always return exactly three hooks, no more, no fewer. A hook is the first thing a person reads or sees. It should make them stop. It should not be a question unless the question is genuinely compelling.

On-screen text: one short line for the first two seconds of video. Under 8 words. The on-screen text must say something the hook does not. The viewer reads both in the first two seconds, so they should be two distinct thoughts, not a shorter version of the same line.

Hashtags: must be correctly spelled, real, searchable terms. Double-check spelling before including. Common correct hashtags for this niche: #nervoussystemchiropractic, #pediatricchiropractor, #chiropractorforkids, #neurologicallybasedchiropractic, #nervoussystemhealth. Note the double S in "nervous system." Never misspell a hashtag.

Return only valid JSON matching the schema given. No markdown fences, no explanation, nothing before or after the JSON.`

export async function generateCaptions(
  doctorId: string,
  transcript: string,
  topic?: string,
  clipLength?: string,
): Promise<{ success: true; data: GeneratedCaptions; captionId: string } | { success: false; error: string; rawOutput?: string }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  // Load doctor
  const { data: doctor } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state, instagram_url, clinic_name, slug')
    .eq('id', doctorId)
    .single()

  if (!doctor) return { success: false, error: 'Doctor not found' }

  const handle = extractInstagramHandle(doctor.instagram_url)
  const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`
  const profileUrl = `https://neurochiro.co/directory/${doctor.slug}`

  // Build user message
  const handleLine = handle
    ? `Instagram handle: ${handle}`
    : `Instagram handle: NONE. This doctor has no Instagram handle. Use the practice name "${doctor.clinic_name || doctorName}" and city "${doctor.city}, ${doctor.state}" instead of a tag.`

  const userMessage = `Doctor: ${doctorName}
${handleLine}
City: ${doctor.city}, ${doctor.state}
Profile URL: ${profileUrl}
Clip length: ${clipLength || '30s'}
${topic ? `Topic/angle: ${topic}` : ''}

Transcript:
${transcript}

Return valid JSON with this exact schema:
{
  "hooks": ["string", "string", "string"],
  "on_screen_text": "string",
  "instagram_caption": "string",
  "tiktok_caption": "string",
  "youtube_title": "string",
  "youtube_description": "string"
}`

  // Call Claude
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { success: false, error: 'ANTHROPIC_API_KEY not configured' }

  let rawText = ''
  let retries = 0

  while (retries < 2) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey })

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      })

      rawText = message.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('')

      break
    } catch (err: any) {
      retries++
      if (retries >= 2) {
        return { success: false, error: `API call failed after 2 attempts: ${err.message || 'Unknown error'}` }
      }
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // Parse JSON defensively
  let parsed: GeneratedCaptions
  try {
    // Strip markdown fences if present
    let cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch (parseErr) {
    if (retries < 1) {
      // Retry once on parse failure
      return generateCaptions(doctorId, transcript, topic, clipLength)
    }
    return { success: false, error: 'Failed to parse JSON response', rawOutput: rawText }
  }

  // Validate
  const errors: string[] = []
  if (!Array.isArray(parsed.hooks) || parsed.hooks.length !== 3) errors.push('hooks must have exactly 3 entries')
  if (!parsed.on_screen_text) errors.push('on_screen_text is empty')
  if (!parsed.instagram_caption) errors.push('instagram_caption is empty')
  if (!parsed.tiktok_caption) errors.push('tiktok_caption is empty')
  if (!parsed.youtube_title) errors.push('youtube_title is empty')
  if (!parsed.youtube_description) errors.push('youtube_description is empty')
  if (parsed.youtube_title && parsed.youtube_title.length > 100) errors.push(`youtube_title is ${parsed.youtube_title.length} chars, max 100`)

  if (errors.length > 0) {
    return { success: false, error: `Validation failed: ${errors.join('; ')}`, rawOutput: rawText }
  }

  // Strip em dashes and en dashes from all fields
  let dashesStripped = 0
  const stripDashes = (s: string): string => {
    const cleaned = s.replace(/[\u2013\u2014]/g, (match) => {
      dashesStripped++
      return match === '\u2014' ? '.' : ','
    })
    return cleaned
  }

  parsed.hooks = parsed.hooks.map(stripDashes) as [string, string, string]
  parsed.on_screen_text = stripDashes(parsed.on_screen_text)
  parsed.instagram_caption = stripDashes(parsed.instagram_caption)
  parsed.tiktok_caption = stripDashes(parsed.tiktok_caption)
  parsed.youtube_title = stripDashes(parsed.youtube_title)
  parsed.youtube_description = stripDashes(parsed.youtube_description)

  if (dashesStripped > 0) {
    console.log(`[CLIP-CAPTIONS] Stripped ${dashesStripped} em/en dashes from generated output for ${doctorName}`)
  }

  // Hashtag validation: fix common misspellings
  const HASHTAG_FIXES: Record<string, string> = {
    '#nervousystemhealth': '#nervoussystemhealth',
    '#nervousystemchiropractor': '#nervoussystemchiropractor',
    '#nervousystem': '#nervoussystem',
    '#neurologicallybased': '#neurologicallybasedchiropractic',
    '#neurologybased': '#neurologybasedchiropractic',
    '#chiropractornereme': '#chiropractornearme',
    '#chiropractorner': '#chiropractornearme',
  }

  const fixHashtags = (text: string): string => {
    let fixed = text
    for (const [bad, good] of Object.entries(HASHTAG_FIXES)) {
      if (fixed.toLowerCase().includes(bad)) {
        fixed = fixed.replace(new RegExp(bad.replace('#', '#'), 'gi'), good)
        console.log(`[CLIP-CAPTIONS] Fixed hashtag: ${bad} → ${good}`)
      }
    }
    // Check for any hashtag with consecutive identical letters removed (common AI typo)
    const hashtags = fixed.match(/#\w+/g) || []
    for (const tag of hashtags) {
      if (tag.match(/nervou?s(?!s)ystem/i)) {
        fixed = fixed.replace(tag, tag.replace(/nervou?ssystem/i, 'nervoussystem').replace(/nervousystem/i, 'nervoussystem'))
        console.log(`[CLIP-CAPTIONS] Fixed missing S in hashtag: ${tag}`)
      }
    }
    return fixed
  }

  parsed.instagram_caption = fixHashtags(parsed.instagram_caption)
  parsed.tiktok_caption = fixHashtags(parsed.tiktok_caption)

  // Auto-save to database
  const { data: inserted, error: insertErr } = await (supabase as any)
    .from('clip_captions')
    .insert({
      doctor_id: doctorId,
      transcript,
      topic: topic || null,
      clip_length: clipLength || '30s',
      generated: parsed,
      status: 'draft',
    })
    .select('id')
    .single()

  if (insertErr) {
    return { success: false, error: `Generated successfully but failed to save: ${insertErr.message}. Output preserved.`, rawOutput: JSON.stringify(parsed, null, 2) }
  }

  return { success: true, data: parsed, captionId: inserted.id }
}

// ── Library ──

export async function getClipLibrary(filters?: {
  doctorId?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ clips: ClipCaption[]; total: number }> {
  await checkAdminAuth()
  const supabase = createAdminClient()

  let query = (supabase as any)
    .from('clip_captions')
    .select('id, doctor_id, transcript, topic, clip_length, generated, hook_selected, status, created_by, approved_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) query = query.or(`transcript.ilike.%${filters.search}%,topic.ilike.%${filters.search}%`)

  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) return { clips: [], total: 0 }

  // Join doctor names
  const doctorIds = [...new Set((data || []).map((c: any) => c.doctor_id))]
  const { data: doctors } = doctorIds.length > 0
    ? await (supabase as any).from('doctors').select('id, first_name, last_name, city').in('id', doctorIds)
    : { data: [] }

  const docMap = new Map<string, any>()
  for (const d of (doctors || [])) docMap.set(d.id, d)

  return {
    clips: (data || []).map((c: any) => {
      const doc = docMap.get(c.doctor_id)
      return {
        ...c,
        doctor_name: doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Unknown',
        doctor_city: doc?.city || '',
      }
    }),
    total: count || 0,
  }
}

export async function updateClipStatus(id: string, status: string): Promise<boolean> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const updates: any = { status, updated_at: new Date().toISOString() }
  if (status === 'approved') updates.approved_at = new Date().toISOString()
  if (status === 'scheduled') updates.scheduled_at = new Date().toISOString()
  if (status === 'posted') updates.posted_at = new Date().toISOString()
  const { error } = await (supabase as any).from('clip_captions').update(updates).eq('id', id)
  return !error
}

export async function updateClipHook(id: string, hook: string): Promise<boolean> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const { error } = await (supabase as any).from('clip_captions').update({ hook_selected: hook, updated_at: new Date().toISOString() }).eq('id', id)
  return !error
}

export async function deleteClip(id: string): Promise<boolean> {
  await checkAdminAuth()
  const supabase = createAdminClient()
  const { error } = await (supabase as any).from('clip_captions').delete().eq('id', id)
  return !error
}
