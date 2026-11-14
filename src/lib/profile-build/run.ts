import 'server-only'

import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import { profileDb, type Query } from './db.ts'
import { extractProfile } from './extract.ts'
import { collectSitePages } from './fetch-site.ts'
import { applyResearch, draftFromExtraction, isBlank } from './fill.ts'
import { storeHeadshot } from './headshot.ts'
import type { ExtractedProfile } from './types.ts'
import { isBookingHost } from './urls.ts'
import { emptyVoice } from './voice.ts'
import { writeProfileCopy } from './write.ts'

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
  if (!website && !booking) throw new Error('No website or booking page on the listing.')

  const pages = await collectSitePages(website, booking)
  const extracted = extractProfile(pages)
  let voice = emptyVoice()
  let followUp = ''
  if (extracted.dossier.trim().length >= 80) {
    try {
      voice = await writeProfileCopy(extracted.dossier)
    } catch (error) {
      followUp = publicError(error)
    }
  }

  let photoUrl = ''
  if (isBlank(doctor.photo_url) && extracted.headshotUrl) {
    try {
      photoUrl = (await storeHeadshot(job.doctor_id, extracted.headshotUrl)) || ''
      if (!photoUrl) followUp = followUp || 'Headshot could not be saved.'
    } catch {
      followUp = followUp || 'Headshot could not be saved.'
    }
  }

  const draft = draftFromExtraction(
    extracted,
    voice,
    photoUrl,
    isBlank(doctor.website_url) && website && !isBookingWebsite(website) ? website : '',
  )
  const patch = applyResearch(doctor, draft, now, { complete: !followUp })
  await writeDoctor(admin, job.doctor_id, patch)
  if (followUp) throw new Error(followUp)

  await admin.from('profile_build_jobs').update({
    status: 'succeeded',
    last_error: null,
    finished_at: now,
    updated_at: now,
    extracted: summary(extracted, Object.keys(patch)),
  }).eq('id', job.id)
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
  delete current.phone
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

function publicError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Profile research failed'
  return message.replace(/\+?\d[\d\s().-]{8,}\d/g, '[phone]').slice(0, 400)
}
