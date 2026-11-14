import 'server-only'

import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'
import { geocodeDoctorAddress } from '@/lib/geocode'
import { isMissingColumn } from '@/lib/leads/schema'
import {
  backfillWithin25,
  instagramComment,
  instagramDm,
  listingInstagramHandle,
  matchClosestIgWaiters,
  parseIgPaste,
  parseLocation,
  type IgWaiter,
} from './dm.ts'

const RAY = 'drray@neurochirodirectory.com'
const PAGE = 1000

const WAITER_COLUMNS = 'id, ig_handle, name, display_name, city, state, latitude, longitude, notified_doctor_ids, status, comment_url, dm_thread_url, last_doctor_sent, last_doctor_sent_miles, flagged_business'
const WAITER_COLUMNS_LEGACY = 'id, ig_handle, name, city, state, latitude, longitude, notified_doctor_ids, status'
const DOCTOR_COLUMNS = 'id, first_name, last_name, city, slug, latitude, longitude, verification_status, instagram_url, instagram_handle_normalized'
const DOCTOR_COLUMNS_LEGACY = 'id, first_name, last_name, city, slug, latitude, longitude, verification_status'

type RowError = { message?: string; code?: string; details?: string } | null

interface FilterBuilder extends PromiseLike<{ data: Record<string, unknown>[] | null; error: RowError }> {
  select: (columns: string) => FilterBuilder
  order: (column: string, options: { ascending: boolean }) => FilterBuilder
  range: (from: number, to: number) => FilterBuilder
  eq: (column: string, value: string) => FilterBuilder
  in: (column: string, values: string[]) => FilterBuilder
  not: (column: string, operator: string, value: null) => FilterBuilder
  limit: (count: number) => FilterBuilder
  ilike: (column: string, value: string) => FilterBuilder
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: RowError }>
  single: () => Promise<{ data: Record<string, unknown> | null; error: RowError }>
  insert: (payload: object) => FilterBuilder
  update: (payload: object) => FilterBuilder
}

function db(): { from: (table: string) => FilterBuilder } {
  return createAdminClient() as unknown as { from: (table: string) => FilterBuilder }
}

async function readPages(
  table: string,
  columns: string,
  filter: (query: FilterBuilder) => FilterBuilder,
): Promise<{ rows: Record<string, unknown>[]; error: RowError }> {
  const rows: Record<string, unknown>[] = []
  let offset = 0
  while (true) {
    const query = filter(
      db().from(table).select(columns).order('created_at', { ascending: true }).range(offset, offset + PAGE - 1),
    )
    const { data, error } = await query
    if (error) return { rows, error }
    if (!Array.isArray(data) || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return { rows, error: null }
}

function mapWaiter(row: Record<string, unknown>): IgWaiter | null {
  const latitude = Number(row.latitude)
  const longitude = Number(row.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const previous = row.last_doctor_sent_miles
  const miles = previous == null || previous === '' ? null : Number(previous)
  return {
    id: String(row.id),
    handle: String(row.ig_handle || ''),
    name: String(row.display_name || row.name || ''),
    displayName: String(row.display_name || row.name || ''),
    city: String(row.city || ''),
    state: String(row.state || ''),
    latitude,
    longitude,
    notifiedDoctorIds: Array.isArray(row.notified_doctor_ids) ? row.notified_doctor_ids.map(String) : [],
    commentUrl: String(row.comment_url || ''),
    dmThreadUrl: String(row.dm_thread_url || ''),
    lastDoctorSentId: row.last_doctor_sent ? String(row.last_doctor_sent) : null,
    lastDoctorSentMiles: miles != null && Number.isFinite(miles) ? miles : null,
    flaggedBusiness: row.flagged_business === true,
  }
}

async function loadWaiters(): Promise<IgWaiter[]> {
  const rich = await readPages('ig_waitlist', WAITER_COLUMNS, (query) => query.eq('status', 'waiting'))
  const result = rich.error && isMissingColumn(rich.error)
    ? await readPages('ig_waitlist', WAITER_COLUMNS_LEGACY, (query) => query.eq('status', 'waiting'))
    : rich
  if (result.error) return []
  return result.rows.flatMap((row) => {
    const waiter = mapWaiter(row)
    return waiter ? [waiter] : []
  })
}

function mapLiveDoctor(row: Record<string, unknown>) {
  const latitude = Number(row.latitude)
  const longitude = Number(row.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return {
    id: String(row.id),
    first_name: String(row.first_name || ''),
    last_name: String(row.last_name || ''),
    city: String(row.city || ''),
    slug: String(row.slug || ''),
    latitude,
    longitude,
    instagram_url: String(row.instagram_url || ''),
    instagram_handle_normalized: String(row.instagram_handle_normalized || ''),
  }
}

async function loadLiveDoctors() {
  const rich = await readPages('doctors', DOCTOR_COLUMNS, (query) =>
    query.eq('verification_status', 'verified').not('latitude', 'is', null),
  )
  const result = rich.error && isMissingColumn(rich.error)
    ? await readPages('doctors', DOCTOR_COLUMNS_LEGACY, (query) =>
      query.eq('verification_status', 'verified').not('latitude', 'is', null),
    )
    : rich
  if (result.error) return []
  return result.rows.flatMap((row) => {
    const doctor = mapLiveDoctor(row)
    return doctor ? [doctor] : []
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

async function insertBatch(doctorId: string, kind: string, doctorHandle: string): Promise<string | null> {
  const rich = await db().from('ig_dm_batches').insert({
    doctor_id: doctorId,
    kind,
    doctor_ig_handle: doctorHandle || null,
  }).select('id').single()
  const saved = rich.error && isMissingColumn(rich.error)
    ? await db().from('ig_dm_batches').insert({ doctor_id: doctorId, kind }).select('id').single()
    : rich
  return saved.data?.id ? String(saved.data.id) : null
}

async function insertItem(payload: Record<string, unknown>, legacy: Record<string, unknown>): Promise<boolean> {
  const rich = await db().from('ig_dm_items').insert(payload)
  if (!rich.error) return true
  if (!isMissingColumn(rich.error)) return false
  const saved = await db().from('ig_dm_items').insert(legacy)
  return !saved.error
}

async function rememberSend(waiter: IgWaiter, doctorId: string, miles: number): Promise<void> {
  const nextIds = Array.from(new Set([...waiter.notifiedDoctorIds, doctorId]))
  const now = new Date().toISOString()
  const rich = await db().from('ig_waitlist').update({
    notified_doctor_ids: nextIds,
    notified_at: now,
    last_doctor_sent: doctorId,
    last_doctor_sent_miles: miles,
  }).eq('id', waiter.id)
  if (rich.error && isMissingColumn(rich.error)) {
    await db().from('ig_waitlist').update({
      notified_doctor_ids: nextIds,
      notified_at: now,
    }).eq('id', waiter.id)
  }
}

function doctorHandleFrom(row: { instagram_url?: string; instagram_handle_normalized?: string }): string {
  return listingInstagramHandle(row.instagram_url, row.instagram_handle_normalized)
}

export async function queueInstagramBatch(doctorId: string): Promise<{ batchId: string; count: number } | null> {
  const selected = await db()
    .from('doctors')
    .select(DOCTOR_COLUMNS)
    .eq('id', doctorId)
    .maybeSingle()
  const doctor = selected.error && isMissingColumn(selected.error)
    ? (await db().from('doctors').select(DOCTOR_COLUMNS_LEGACY).eq('id', doctorId).maybeSingle()).data
    : selected.data
  const latitude = Number(doctor?.latitude)
  const longitude = Number(doctor?.longitude)
  if (!doctor || doctor.verification_status !== 'verified' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const [waiters, live] = await Promise.all([loadWaiters(), loadLiveDoctors()])
  if (!live.some((row) => row.id === doctorId)) live.push({ id: doctorId, latitude, longitude, first_name: '', last_name: '', city: '', slug: '', instagram_url: '', instagram_handle_normalized: '' })
  const matches = matchClosestIgWaiters(waiters, { id: doctorId, latitude, longitude }, live)
  if (!matches.length) return null

  const doctorName = `Dr. ${doctor.last_name || doctor.first_name || ''}`.trim()
  const doctorHandle = doctorHandleFrom(doctor)
  const profileUrl = String(doctor.slug || '')
  const batchId = await insertBatch(doctorId, 'approval', doctorHandle)
  if (!batchId) return null

  let count = 0
  for (const match of matches) {
    const area = [match.city, match.state].filter(Boolean).join(', ')
    const comment = match.commentUrl
      ? instagramComment({
        name: match.name,
        handle: match.handle,
        doctorName,
        doctorHandle,
        doctorCity: String(doctor.city || ''),
        profileUrl,
        variantKey: `${match.id}:${doctorId}`,
      })
      : ''
    const message = instagramDm({
      name: match.name,
      handle: match.handle,
      doctorName,
      doctorCity: String(doctor.city || ''),
      profileUrl,
    })
    const saved = await insertItem({
      batch_id: batchId,
      waitlist_id: match.id,
      doctor_id: doctorId,
      ig_handle: match.handle || null,
      display_name: match.displayName || match.name || null,
      comment_url: match.commentUrl || null,
      dm_thread_url: match.dmThreadUrl || null,
      comment_message: comment || null,
      doctor_ig_handle: doctorHandle || null,
      area,
      distance_miles: match.miles,
      message,
    }, {
      batch_id: batchId,
      waitlist_id: match.id,
      doctor_id: doctorId,
      ig_handle: match.handle || match.displayName || match.name || 'request',
      area,
      distance_miles: match.miles,
      message,
    })
    if (!saved) continue
    count += 1
    await rememberSend(match, doctorId, match.miles)
  }
  if (!count) return null
  const link = `https://neurochiro.co/admin/instagram`
  await emailRay(
    `Instagram list ready: ${count}`,
    `${count} Instagram ${count === 1 ? 'person is' : 'people are'} ready for ${doctorName} in ${doctor.city || 'their city'}.\nNothing was sent. Copy the comment and the DM from ${link}`,
  )
  await db().from('ig_dm_batches').update({ emailed_at: new Date().toISOString() }).eq('id', batchId)
  return { batchId, count }
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
    const existingId = existing.data?.id ? String(existing.data.id) : ''
    const result = existingId
      ? await db().from('ig_waitlist').update(payload).eq('id', existingId)
      : await db().from('ig_waitlist').insert(payload)
    if (result.error) skipped += 1
    else saved += 1
  }
  return { saved, skipped, errors: parsed.errors }
}

export async function buildBackfillBatches(): Promise<{ batches: number; people: number }> {
  const waiters = await loadWaiters()
  const live = await loadLiveDoctors()
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
    const doctor = live.find((row) => row.id === doctorId)
    if (!doctor) continue
    const doctorHandle = doctorHandleFrom(doctor)
    const batchId = await insertBatch(doctorId, 'backfill', doctorHandle)
    if (!batchId) continue
    const doctorName = `Dr. ${doctor.last_name || doctor.first_name || ''}`.trim()
    for (const hit of group) {
      const comment = hit.waiter.commentUrl
        ? instagramComment({
          name: hit.waiter.name,
          handle: hit.waiter.handle,
          doctorName,
          doctorHandle,
          doctorCity: doctor.city,
          profileUrl: doctor.slug,
          variantKey: `${hit.waiter.id}:${doctorId}`,
        })
        : ''
      const message = instagramDm({
        name: hit.waiter.name,
        handle: hit.waiter.handle,
        doctorName,
        doctorCity: doctor.city,
        profileUrl: doctor.slug,
      })
      const saved = await insertItem({
        batch_id: batchId,
        waitlist_id: hit.waiter.id,
        doctor_id: doctorId,
        ig_handle: hit.waiter.handle || null,
        display_name: hit.waiter.displayName || hit.waiter.name || null,
        comment_url: hit.waiter.commentUrl || null,
        dm_thread_url: hit.waiter.dmThreadUrl || null,
        comment_message: comment || null,
        doctor_ig_handle: doctorHandle || null,
        area: [hit.waiter.city, hit.waiter.state].filter(Boolean).join(', '),
        distance_miles: hit.miles,
        message,
      }, {
        batch_id: batchId,
        waitlist_id: hit.waiter.id,
        doctor_id: doctorId,
        ig_handle: hit.waiter.handle || hit.waiter.displayName || hit.waiter.name || 'request',
        area: [hit.waiter.city, hit.waiter.state].filter(Boolean).join(', '),
        distance_miles: hit.miles,
        message,
      })
      if (!saved) continue
      people += 1
      await rememberSend(hit.waiter, doctorId, hit.miles)
    }
    batches += 1
  }
  if (people) {
    await emailRay(
      `Instagram backfill ready: ${people}`,
      `${people} Instagram ${people === 1 ? 'person already has' : 'people already have'} a live doctor within 25 miles, across ${batches} ${batches === 1 ? 'batch' : 'batches'}.\nNothing was sent. Open them: https://neurochiro.co/admin/instagram`,
    )
  }
  return { batches, people }
}

export async function loadInstagramBoard() {
  const probe = await db().from('ig_waitlist').select('display_name').limit(1)
  const rich = !probe.error
  const batchColumns = rich
    ? 'id, doctor_id, kind, created_at, doctor_ig_handle'
    : 'id, doctor_id, kind, created_at'
  const batches = await db().from('ig_dm_batches').select(batchColumns).order('created_at', { ascending: false }).limit(20)
  const batchIds = (batches.data || []).map((row) => String(row.id))
  const itemColumns = rich
    ? 'id, batch_id, ig_handle, display_name, area, doctor_id, distance_miles, message, comment_message, comment_url, dm_thread_url, doctor_ig_handle, sent_at'
    : 'id, batch_id, ig_handle, area, doctor_id, distance_miles, message, sent_at'
  const items = batchIds.length
    ? await readPages('ig_dm_items', itemColumns, (query) => query.in('batch_id', batchIds))
    : { rows: [] as Record<string, unknown>[], error: null as RowError }
  let waiters: { rows: Record<string, unknown>[]; error: RowError }
  if (rich) {
    waiters = await readPages('ig_waitlist', WAITER_COLUMNS, (query) => query.eq('status', 'waiting'))
  } else {
    const legacy = await db().from('ig_waitlist').select(WAITER_COLUMNS_LEGACY).eq('status', 'waiting').limit(500)
    const legacyRows = Array.isArray(legacy?.data) ? legacy.data as Record<string, unknown>[] : []
    waiters = { rows: legacyRows, error: legacy?.error ?? null }
  }
  const doctors = await readPages(
    'doctors',
    'id, first_name, last_name, city, latitude, longitude, verification_status',
    (query) => query.eq('verification_status', 'verified').not('latitude', 'is', null),
  )
  return {
    rich,
    batches: (batches.data || []) as Record<string, unknown>[],
    batchesError: batches.error as RowError,
    items: items.rows,
    itemsError: items.error,
    waiters: waiters.rows,
    waitersError: waiters.error,
    doctors: doctors.rows,
    doctorsError: doctors.error,
  }
}
