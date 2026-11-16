import 'server-only'

import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import { profileDb, type Query } from './db.ts'
import { extractProfile } from './extract.ts'
import { collectSitePages } from './fetch-site.ts'
import { applyResearch, draftFromExtraction, isBlank } from './fill.ts'
import { storeHeadshot } from './headshot.ts'
import type { ExtractedProfile } from './types.ts'
import { isBookingHost } from './urls.ts'
import { emptyVoice, minimumVoice } from './voice.ts'
import { writeProfileCopy } from './write.ts'
import { pinDoctor } from '@/lib/go-live/pin'

const MAX_ATTEMPTS = 3

type JobRow = {
  id: string
  doctor_id: string
  website_url?: string | null
  booking_url?: string | null
  status?: string
  attempts?: number
  started_at?: string | null
  next_run_at?: string | null
}

type Admin = {
  from: (table: string) => Query
}

export async function runProfileBuildBatch(): Promise<{
  processed: number
  succeeded: number
  failed: number
  skipped?: string
}> {
  const admin = profileDb()
  const now = new Date()
  const nowIso = now.toISOString()
  const stale = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('profile_build_jobs')
    .select('id, doctor_id, website_url, booking_url, status, attempts, started_at, next_run_at')
    .in('status', ['pending', 'failed', 'processing'])
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(20)
  if (error) {
    if (isMissingTable(error)) return { processed: 0, succeeded: 0, failed: 0, skipped: 'migration_not_applied' }
    throw new Error('Could not read profile build jobs')
  }
  const due = ((data || []) as JobRow[]).filter((job) => {
    if (job.status === 'processing') return Boolean(job.started_at && job.started_at < stale)
    return !job.next_run_at || job.next_run_at <= nowIso
  }).slice(0, 2)

  let succeeded = 0
  let failed = 0
  for (const job of due) {
    const attempts = Number(job.attempts || 0) + 1
    const claimed = await claim(admin, job, attempts, nowIso)
    if (!claimed) continue
    try {
      await processJob(admin, job, nowIso)
      succeeded += 1
    } catch (error) {
      await markFailed(admin, job.id, attempts, error)
      failed += 1
    }
  }
  return { processed: succeeded + failed, succeeded, failed }
}

async function claim(admin: Admin, job: JobRow, attempts: number, now: string): Promise<boolean> {
  const { data, error } = await admin
    .from('profile_build_jobs')
    .update({ status: 'processing', started_at: now, updated_at: now, attempts })
    .eq('id', job.id)
    .eq('attempts', Number(job.attempts || 0))
    .select('id')
  if (error) return false
  return Array.isArray(data) && data.length === 1
}

async function processJob(admin: Admin, job: JobRow, now: string): Promise<void> {
  const doctorResult = await admin.from('doctors').select('*').eq('id', job.doctor_id).maybeSingle()
  if (doctorResult.error || !doctorResult.data) throw new Error('Doctor listing was not found.')
  const doctor = doctorResult.data as Record<string, unknown>
  const website = firstUrl(doctor.website_url, job.website_url)
  const booking = firstUrl(doctor.booking_url, job.booking_url)
  if (!website && !booking) {
    await publishMinimum(admin, job, doctor, now, 'No website or booking page on the listing.')
    return
  }

  let pages
  try {
    pages = await collectSitePages(website, booking)
  } catch (error) {
    await publishMinimum(admin, job, doctor, now, publicError(error))
    return
  }
  const extracted = extractProfile(pages)
  const voiceResult = await voiceOrMinimum(extracted, doctor)
  let photoNote = ''
  let photoUrl = ''
  if (isBlank(doctor.photo_url) && extracted.headshotUrl) {
    try {
      photoUrl = (await storeHeadshot(job.doctor_id, extracted.headshotUrl)) || ''
      if (!photoUrl) photoNote = 'Headshot could not be saved.'
    } catch {
      photoNote = 'Headshot could not be saved.'
    }
  }

  const draft = draftFromExtraction(
    extracted,
    voiceResult.voice,
    photoUrl,
    isBlank(doctor.website_url) && website && !isBookingWebsite(website) ? website : '',
  )
  const alerts = Array.isArray(doctor.lead_alert_phones) ? doctor.lead_alert_phones.filter((item): item is string => typeof item === 'string') : []
  const patch = applyResearch(doctor, draft, now, { complete: true, alertPhones: alerts })
  patch.needs_ai_enrich = voiceResult.needsAi
  await writeDoctor(admin, job.doctor_id, patch)
  const pinned = await pinIfNeeded(job.doctor_id, doctor, patch)
  const notes = [
    voiceResult.needsAi ? 'needs AI enrich' : '',
    photoNote,
    pinned ? '' : 'Map pin was not saved.',
  ].filter(Boolean)

  await finishJob(admin, job.id, now, notes.join(' '), summary(extracted, Object.keys(patch)))
}

async function publishMinimum(
  admin: Admin,
  job: JobRow,
  doctor: Record<string, unknown>,
  now: string,
  reason: string,
): Promise<void> {
  const voice = minimumVoice({
    doctorName: text(doctor.last_name) || text(doctor.first_name),
    clinicName: text(doctor.clinic_name),
    city: text(doctor.city),
    state: text(doctor.state),
    techniques: Array.isArray(doctor.specialties) ? doctor.specialties.filter((item): item is string => typeof item === 'string') : [],
    firstVisitInfo: text(doctor.first_visit_info),
    faqs: [],
  })
  const extracted = extractProfile([])
  const draft = draftFromExtraction(extracted, voice, '', '')
  const alerts = Array.isArray(doctor.lead_alert_phones) ? doctor.lead_alert_phones.filter((item): item is string => typeof item === 'string') : []
  const patch = applyResearch(doctor, draft, now, { complete: true, alertPhones: alerts })
  patch.needs_ai_enrich = true
  await writeDoctor(admin, job.doctor_id, patch)
  await finishJob(admin, job.id, now, `needs AI enrich. ${reason}`, { fields: Object.keys(patch) })
}

async function finishJob(admin: Admin, jobId: string, now: string, note: string, extracted: unknown): Promise<void> {
  if (!jobId) return
  await admin.from('profile_build_jobs').update({
    status: 'succeeded',
    last_error: note || null,
    finished_at: now,
    updated_at: now,
    extracted,
  }).eq('id', jobId)
}

export async function buildDoctorProfileNow(doctorId: string): Promise<{ ok: boolean; reason: string }> {
  const admin = profileDb()
  const now = new Date().toISOString()
  try {
    await processJob(admin, { id: '', doctor_id: doctorId }, now)
    const saved = await admin.from('doctors').select('needs_ai_enrich, latitude, longitude').eq('id', doctorId).maybeSingle()
    const row = (saved.data || {}) as Record<string, unknown>
    const needsAi = row.needs_ai_enrich === true
    const latitude = Number(row.latitude)
    const pinned = Number.isFinite(latitude) && latitude !== 0 && Number.isFinite(Number(row.longitude))
    const reason = [
      needsAi ? 'Published a minimum profile. Needs AI enrich.' : 'Published the researched profile.',
      pinned ? 'Map pin saved.' : 'Map pin is still missing.',
    ].join(' ')
    return { ok: pinned, reason }
  } catch (error) {
    return { ok: false, reason: publicError(error) }
  }
}

async function voiceOrMinimum(
  extracted: ExtractedProfile,
  doctor: Record<string, unknown>,
): Promise<{ voice: ReturnType<typeof emptyVoice>; needsAi: boolean }> {
  if (extracted.dossier.trim().length >= 80) {
    try {
      const voice = await writeProfileCopy(extracted.dossier)
      if (voice.bio.trim()) return { voice, needsAi: false }
    } catch {
      // Gateway billing, timeouts, and model errors still publish a minimum profile.
    }
  }
  const doctorName = [text(doctor.last_name) || text(doctor.first_name)].filter(Boolean).join(' ')
  return {
    needsAi: true,
    voice: minimumVoice({
      doctorName,
      clinicName: extracted.clinicName || text(doctor.clinic_name),
      city: extracted.city || text(doctor.city),
      state: extracted.state || text(doctor.state),
      techniques: extracted.techniques,
      firstVisitInfo: extracted.firstVisitInfo,
      faqs: extracted.faqs,
    }),
  }
}

async function pinIfNeeded(
  doctorId: string,
  doctor: Record<string, unknown>,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const latitude = Number(doctor.latitude)
  const longitude = Number(doctor.longitude)
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)) return true
  const address = text(patch.address) || text(doctor.address)
  const city = text(patch.city) || text(doctor.city)
  const state = text(patch.state) || text(doctor.state)
  const country = text(patch.country) || text(doctor.country) || 'US'
  if (address.trim().length < 4 || city.trim().length < 2) return false
  return pinDoctor(doctorId, address, city, state, country)
}

async function markFailed(admin: Admin, jobId: string, attempts: number, error: unknown): Promise<void> {
  const exhausted = attempts >= MAX_ATTEMPTS
  const now = new Date().toISOString()
  const next = new Date(Date.now() + attempts * 5 * 60 * 1000).toISOString()
  await admin.from('profile_build_jobs').update({
    status: exhausted ? 'failed' : 'pending',
    last_error: publicError(error),
    updated_at: now,
    finished_at: exhausted ? now : null,
    next_run_at: next,
  }).eq('id', jobId)
}

async function writeDoctor(admin: Admin, doctorId: string, patch: Record<string, unknown>): Promise<void> {
  const current = { ...patch }
  delete current.lead_alert_phones
  delete current.email
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (Object.keys(current).length === 0) return
    const result = await admin.from('doctors').update(current).eq('id', doctorId)
    if (!result.error) return
    if (!isMissingColumn(result.error)) throw new Error('Profile update failed')
    const message = String(result.error.message || '')
    const named = message.match(/'([a-z0-9_]+)'/i)?.[1] || message.match(/column "([a-z0-9_]+)"/i)?.[1]
    if (!named || !(named in current)) throw new Error('Profile update failed')
    delete current[named]
  }
}

function summary(extracted: ExtractedProfile, fields: string[]) {
  return {
    clinicName: extracted.clinicName,
    hours: extracted.hours,
    bookingUrl: extracted.bookingUrl,
    city: extracted.city,
    state: extracted.state,
    fields,
  }
}

function firstUrl(primary: unknown, fallback: unknown): string {
  const first = typeof primary === 'string' ? primary.trim() : ''
  if (first) return first
  return typeof fallback === 'string' ? fallback.trim() : ''
}

function isBookingWebsite(value: string): boolean {
  try {
    return isBookingHost(new URL(value).hostname)
  } catch {
    return false
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function publicError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Profile research failed'
  return message.replace(/\+?\d[\d\s().-]{8,}\d/g, '[phone]').slice(0, 400)
}
