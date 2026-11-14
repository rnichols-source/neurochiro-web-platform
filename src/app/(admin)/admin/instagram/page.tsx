import Link from 'next/link'
import { requireAdminPage } from '@/lib/founder/guard'
import { backfillWithin25, musePaste, type IgWaiter } from '@/lib/instagram/dm'
import { loadInstagramBoard } from '@/lib/instagram/queue'
import { InstagramBatch, type IgRow } from './batch-client'
import { InstagramImport } from './import-form'

export const dynamic = 'force-dynamic'

function text(value: unknown): string {
  return value == null ? '' : String(value)
}

export default async function InstagramPage() {
  await requireAdminPage()
  const board = await loadInstagramBoard()
  const doctorName = new Map<string, string>()
  for (const doctor of board.doctors) {
    doctorName.set(text(doctor.id), `Dr. ${text(doctor.last_name) || text(doctor.first_name) || 'doctor'} · ${text(doctor.city)}`)
  }
  const grouped = new Map<string, IgRow[]>()
  for (const item of board.items) {
    const row: IgRow = {
      id: text(item.id),
      handle: text(item.ig_handle),
      displayName: text(item.display_name),
      area: text(item.area),
      doctor: doctorName.get(text(item.doctor_id)) || 'Doctor',
      miles: item.distance_miles == null ? null : Number(item.distance_miles),
      message: text(item.message),
      comment: text(item.comment_message),
      commentUrl: text(item.comment_url),
      dmUrl: text(item.dm_thread_url),
      doctorHandle: text(item.doctor_ig_handle),
      sent: Boolean(item.sent_at),
    }
    const list = grouped.get(text(item.batch_id)) || []
    list.push(row)
    grouped.set(text(item.batch_id), list)
  }
  for (const rows of grouped.values()) {
    rows.sort((a, b) => (a.miles ?? 9999) - (b.miles ?? 9999))
  }
  const ready = board.waiters.flatMap((row) => {
    const latitude = Number(row.latitude)
    const longitude = Number(row.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    const waiter: IgWaiter = {
      id: text(row.id),
      handle: text(row.ig_handle),
      name: text(row.display_name) || text(row.name),
      displayName: text(row.display_name) || text(row.name),
      city: text(row.city),
      state: text(row.state),
      latitude,
      longitude,
      notifiedDoctorIds: Array.isArray(row.notified_doctor_ids) ? row.notified_doctor_ids.map(String) : [],
      commentUrl: text(row.comment_url),
      dmThreadUrl: text(row.dm_thread_url),
    }
    return [waiter]
  })
  const live = board.doctors.flatMap((row) => {
    const latitude = Number(row.latitude)
    const longitude = Number(row.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    return [{ id: text(row.id), latitude, longitude }]
  })
  const already = backfillWithin25(ready, live)
  const blocked = board.batchesError || board.itemsError || board.waitersError

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-[#D66829]">Instagram</p>
        <h1 className="text-2xl font-bold text-[#15202B]">DMs to send</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#5b6773]">These are not sent from the site. Each person has a comment to post on their original comment and a DM. Both use the doctor&apos;s request form. Copy a batch into Muse. Mark each one sent so the same person is not queued twice for the same doctor.</p>
      </div>
      <InstagramImport />
      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-[#15202B]">Already near a live doctor</h2>
        <p className="mt-1 text-sm text-[#5b6773]">{already.length} waiting {already.length === 1 ? 'person is' : 'people are'} within 25 miles of a doctor who is already live.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {already.slice(0, 40).map((row) => {
            const label = row.waiter.handle ? `@${row.waiter.handle}` : (row.waiter.displayName || row.waiter.name || 'No name saved')
            return (
              <li key={`${row.waiter.id}-${row.doctorId}`}>{label} · {[row.waiter.city, row.waiter.state].filter(Boolean).join(', ') || 'area saved'} · {doctorName.get(row.doctorId) || 'Doctor'} · {row.miles} mi</li>
            )
          })}
        </ul>
      </section>
      {board.batches.map((batch) => {
        const id = text(batch.id)
        const rows = grouped.get(id) || []
        const doctorId = text(batch.doctor_id)
        const kind = text(batch.kind)
        const created = text(batch.created_at)
        return (
          <InstagramBatch
            key={id}
            title={`${kind === 'backfill' ? 'Backfill' : 'New doctor'} · ${doctorName.get(doctorId) || 'Doctor'} · ${created ? new Date(created).toLocaleDateString('en-US') : ''}`}
            rows={rows}
            paste={musePaste(rows.filter((row) => !row.sent).map((row) => ({
              handle: row.handle,
              displayName: row.displayName,
              message: row.message,
              comment: row.comment,
              commentUrl: row.commentUrl,
              dmUrl: row.dmUrl,
            })))}
          />
        )
      })}
      {blocked ? <p className="text-sm">The Instagram tables are not ready. Apply supabase/migrations/20261114200715_go_live_setup.sql and supabase/migrations/20261115120000_ig_waitlist_mentions.sql, then refresh. The backfill in scripts/backfill-ig-waitlist.sql is separate and is not run from this page.</p> : null}
      {!board.rich && !blocked ? <p className="text-sm">Comment links and display names show after supabase/migrations/20261115120000_ig_waitlist_mentions.sql is applied. Nothing is sent automatically.</p> : null}
      <p className="text-sm"><Link href="/admin" className="font-bold text-[#D66829]">Back to Pulse</Link></p>
    </div>
  )
}
