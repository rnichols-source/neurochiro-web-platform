import Link from 'next/link'
import { requireAdminPage } from '@/lib/founder/guard'
import { createAdminClient } from '@/lib/supabase-admin'
import { backfillWithin25, musePaste, type IgWaiter } from '@/lib/instagram/dm'
import { InstagramBatch, type IgRow } from './batch-client'
import { InstagramImport } from './import-form'

export const dynamic = 'force-dynamic'

export default async function InstagramPage() {
  await requireAdminPage()
  const admin = createAdminClient() as any
  const [batches, items, waiters, doctors] = await Promise.all([
    admin.from('ig_dm_batches').select('id, doctor_id, kind, created_at').order('created_at', { ascending: false }).limit(20),
    admin.from('ig_dm_items').select('id, batch_id, ig_handle, area, doctor_id, distance_miles, message, sent_at').order('distance_miles', { ascending: true }).limit(500),
    admin.from('ig_waitlist').select('id, ig_handle, name, city, state, latitude, longitude, notified_doctor_ids, status').eq('status', 'waiting').limit(500),
    admin.from('doctors').select('id, first_name, last_name, city, latitude, longitude, verification_status').eq('verification_status', 'verified').not('latitude', 'is', null).limit(500),
  ])
  const doctorName = new Map<string, string>()
  for (const doctor of doctors.data || []) {
    doctorName.set(String(doctor.id), `Dr. ${doctor.last_name || doctor.first_name || 'doctor'} · ${doctor.city || ''}`)
  }
  const grouped = new Map<string, IgRow[]>()
  for (const item of items.data || []) {
    const row: IgRow = {
      id: String(item.id),
      handle: String(item.ig_handle || ''),
      area: String(item.area || ''),
      doctor: doctorName.get(String(item.doctor_id)) || 'Doctor',
      miles: item.distance_miles == null ? null : Number(item.distance_miles),
      message: String(item.message || ''),
      sent: Boolean(item.sent_at),
    }
    const list = grouped.get(String(item.batch_id)) || []
    list.push(row)
    grouped.set(String(item.batch_id), list)
  }
  const ready = (waiters.data || []).flatMap((row: Record<string, unknown>) => {
    const latitude = Number(row.latitude)
    const longitude = Number(row.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    const waiter: IgWaiter = {
      id: String(row.id),
      handle: String(row.ig_handle || ''),
      name: String(row.name || ''),
      city: String(row.city || ''),
      state: String(row.state || ''),
      latitude,
      longitude,
      notifiedDoctorIds: Array.isArray(row.notified_doctor_ids) ? row.notified_doctor_ids.map(String) : [],
    }
    return [waiter]
  })
  const live = (doctors.data || []).flatMap((row: Record<string, unknown>) => {
    const latitude = Number(row.latitude)
    const longitude = Number(row.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    return [{ id: String(row.id), latitude, longitude }]
  })
  const already = backfillWithin25(ready, live)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-[#D66829]">Instagram</p>
        <h1 className="text-2xl font-bold text-[#15202B]">DMs to send</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#5b6773]">These are not sent from the site. Copy a batch into Muse. Mark each one sent so the same person is not queued twice for the same doctor.</p>
      </div>
      <InstagramImport />
      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-[#15202B]">Already near a live doctor</h2>
        <p className="mt-1 text-sm text-[#5b6773]">{already.length} waiting {already.length === 1 ? 'person is' : 'people are'} within 25 miles of a doctor who is already live.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {already.slice(0, 40).map((row) => (
            <li key={`${row.waiter.id}-${row.doctorId}`}>@{row.waiter.handle} · {[row.waiter.city, row.waiter.state].filter(Boolean).join(', ') || 'area saved'} · {doctorName.get(row.doctorId) || 'Doctor'} · {row.miles} mi</li>
          ))}
        </ul>
      </section>
      {(batches.data || []).map((batch: { id: string; kind: string; created_at: string; doctor_id: string }) => {
        const rows = grouped.get(String(batch.id)) || []
        return (
          <InstagramBatch
            key={batch.id}
            title={`${batch.kind === 'backfill' ? 'Backfill' : 'New doctor'} · ${doctorName.get(String(batch.doctor_id)) || 'Doctor'} · ${new Date(batch.created_at).toLocaleDateString('en-US')}`}
            rows={rows}
            paste={musePaste(rows.filter((row) => !row.sent).map((row) => ({ handle: row.handle, message: row.message })))}
          />
        )
      })}
      {(batches.error || items.error) ? <p className="text-sm">The Instagram tables are not in the database yet. Apply supabase/migrations/20261114200715_go_live_setup.sql, then refresh.</p> : null}
      <p className="text-sm"><Link href="/admin" className="font-bold text-[#D66829]">Back to Pulse</Link></p>
    </div>
  )
}
