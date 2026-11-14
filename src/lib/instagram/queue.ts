import 'server-only'

import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'
import { geocodeDoctorAddress } from '@/lib/geocode'
import { doctorProfileUrl } from '@/lib/applications/approval-sms'
import {
  backfillWithin25,
  instagramDm,
  matchIgWaiters,
  parseIgPaste,
  parseLocation,
  type IgWaiter,
} from './dm.ts'

const RAY = 'drray@neurochirodirectory.com'

function db() {
  return createAdminClient() as any
}

async function loadWaiters(): Promise<IgWaiter[]> {
  const { data, error } = await db()
    .from('ig_waitlist')
    .select('id, ig_handle, name, city, state, latitude, longitude, notified_doctor_ids, status')
    .eq('status', 'waiting')
    .limit(500)
  if (error || !Array.isArray(data)) return []
  return data.flatMap((row: Record<string, unknown>) => {
    const latitude = Number(row.latitude)
    const longitude = Number(row.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    return [{
      id: String(row.id),
      handle: String(row.ig_handle || ''),
      name: String(row.name || ''),
      city: String(row.city || ''),
      state: String(row.state || ''),
      latitude,
      longitude,
      notifiedDoctorIds: Array.isArray(row.notified_doctor_ids) ? row.notified_doctor_ids.map(String) : [],
    }]
  })
}

async function emailRay(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY || ''
  if (!key) return
  const resend = new Resend(key)
  await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: RAY,
    subject,
    html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
  }).catch(() => undefined)
}

export async function queueInstagramBatch(doctorId: string): Promise<{ batchId: string; count: number } | null> {
  const { data: doctor } = await db()
    .from('doctors')
    .select('id, first_name, last_name, city, slug, latitude, longitude, verification_status')
    .eq('id', doctorId)
    .maybeSingle()
  const latitude = Number(doctor?.latitude)
  const longitude = Number(doctor?.longitude)
  if (!doctor || doctor.verification_status !== 'verified' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const matches = matchIgWaiters(await loadWaiters(), { id: doctorId, latitude, longitude }, 50)
  if (!matches.length) return null
  const doctorName = `Dr. ${doctor.last_name || doctor.first_name || ''}`.trim()
  const profileUrl = doctorProfileUrl(doctor.slug)
  const batch = await db().from('ig_dm_batches').insert({ doctor_id: doctorId, kind: 'approval' }).select('id').single()
  if (batch.error || !batch.data?.id) return null
  const batchId = String(batch.data.id)
  for (const match of matches) {
    const area = [match.city, match.state].filter(Boolean).join(', ')
    const message = instagramDm({
      name: match.name,
      handle: match.handle,
      doctorName,
      doctorCity: String(doctor.city || ''),
      profileUrl,
    })
    const inserted = await db().from('ig_dm_items').insert({
      batch_id: batchId,
      waitlist_id: match.id,
      doctor_id: doctorId,
      ig_handle: match.handle,
      area,
      distance_miles: match.miles,
      message,
    })
    if (inserted.error) continue
    const nextIds = Array.from(new Set([...match.notifiedDoctorIds, doctorId]))
    await db().from('ig_waitlist').update({
      notified_doctor_ids: nextIds,
      notified_at: new Date().toISOString(),
    }).eq('id', match.id)
  }
  const link = `https://neurochiro.co/admin/instagram/${batchId}`
  await emailRay(
    `Instagram DMs ready: ${matches.length}`,
    `${matches.length} Instagram ${matches.length === 1 ? 'person is' : 'people are'} near ${doctorName} in ${doctor.city || 'their city'}.\nOpen the batch: ${link}`,
  )
  await db().from('ig_dm_batches').update({ emailed_at: new Date().toISOString() }).eq('id', batchId)
  return { batchId, count: matches.length }
}

export async function importIgPaste(text: string): Promise<{ saved: number; skipped: number; errors: string[] }> {
  const parsed = parseIgPaste(text)
  let saved = 0
  let skipped = 0
  for (const row of parsed.rows) {
    const place = parseLocation(row.location)
    const point = await geocodeDoctorAddress(row.location, place.city, place.state, place.country || 'US').catch(() => null)
    const existing = await db().from('ig_waitlist').select('id').ilike('ig_handle', row.handle).maybeSingle()
    const payload = {
      ig_handle: row.handle,
      city: place.city || null,
      state: place.state || null,
      zip: place.zip || null,
      country: place.country || null,
      location_raw: row.location,
      latitude: point?.lat ?? null,
      longitude: point?.lng ?? null,
      requested_at: row.requestedAt,
      status: 'waiting',
    }
    const result = existing.data?.id
      ? await db().from('ig_waitlist').update(payload).eq('id', existing.data.id)
      : await db().from('ig_waitlist').insert(payload)
    if (result.error) skipped += 1
    else saved += 1
  }
  return { saved, skipped, errors: parsed.errors }
}

export async function buildBackfillBatches(): Promise<{ batches: number; people: number }> {
  const waiters = await loadWaiters()
  const { data: doctors } = await db()
    .from('doctors')
    .select('id, first_name, last_name, city, slug, latitude, longitude')
    .eq('verification_status', 'verified')
    .not('latitude', 'is', null)
    .limit(500)
  const live = (doctors || []).flatMap((row: Record<string, unknown>) => {
    const latitude = Number(row.latitude)
    const longitude = Number(row.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    return [{ ...row, latitude, longitude, id: String(row.id) }]
  })
  const hits = backfillWithin25(waiters, live)
  const byDoctor = new Map<string, typeof hits>()
  for (const hit of hits) {
    const list = byDoctor.get(hit.doctorId) || []
    list.push(hit)
    byDoctor.set(hit.doctorId, list)
  }
  let batches = 0
  let people = 0
  for (const [doctorId, group] of byDoctor) {
    const doctor = live.find((row: { id: string }) => row.id === doctorId)
    if (!doctor) continue
    const batch = await db().from('ig_dm_batches').insert({ doctor_id: doctorId, kind: 'backfill' }).select('id').single()
    if (!batch.data?.id) continue
    const doctorName = `Dr. ${doctor.last_name || doctor.first_name || ''}`.trim()
    const profileUrl = doctorProfileUrl(String(doctor.slug || ''))
    for (const hit of group) {
      const message = instagramDm({
        name: hit.waiter.name,
        handle: hit.waiter.handle,
        doctorName,
        doctorCity: String(doctor.city || ''),
        profileUrl,
      })
      const inserted = await db().from('ig_dm_items').insert({
        batch_id: batch.data.id,
        waitlist_id: hit.waiter.id,
        doctor_id: doctorId,
        ig_handle: hit.waiter.handle,
        area: [hit.waiter.city, hit.waiter.state].filter(Boolean).join(', '),
        distance_miles: hit.miles,
        message,
      })
      if (inserted.error) continue
      people += 1
      await db().from('ig_waitlist').update({
        notified_doctor_ids: Array.from(new Set([...hit.waiter.notifiedDoctorIds, doctorId])),
        notified_at: new Date().toISOString(),
      }).eq('id', hit.waiter.id)
    }
    batches += 1
  }
  if (people) {
    await emailRay(
      `Instagram backfill ready: ${people}`,
      `${people} Instagram ${people === 1 ? 'person already has' : 'people already have'} a live doctor within 25 miles, across ${batches} ${batches === 1 ? 'batch' : 'batches'}.\nOpen them: https://neurochiro.co/admin/instagram`,
    )
  }
  return { batches, people }
}
