'use client'

import { useState } from 'react'
import type { AdminApplicationRow } from '@/lib/applications/admin-row'
import { approveDoctorApplication, declineDoctorApplication } from './actions'

export function ApplicationsClient({
  rows,
  loadError,
  initialNotice = '',
}: {
  rows: AdminApplicationRow[]
  loadError: string | null
  initialNotice?: string
}) {
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [warning, setWarning] = useState(initialNotice)
  const [busy, setBusy] = useState('')

  const visible = rows.filter((row) => filter === 'all' || row.status === 'draft' || row.status === 'under_review' || row.status === 'needs_action')

  async function run(id: string, kind: 'approve' | 'decline') {
    setBusy(`${kind}:${id}`)
    setMessage('')
    setWarning('')
    const action = kind === 'approve' ? approveDoctorApplication : declineDoctorApplication
    const result = await action(id, notes[id] || '')
    setMessage(result.message)
    setWarning(result.warning || '')
    setBusy('')
    if (result.ok && result.warning) {
      window.location.href = `/admin/applications?notice=${encodeURIComponent(result.warning)}`
      return
    }
    if (result.ok) window.location.reload()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neuro-navy">Doctor applications</h1>
        <p className="mt-1 text-sm text-neuro-navy/80">
          Approve charges the saved card and publishes the listing. Decline keeps the listing hidden, removes the card, and does not charge.
        </p>
      </div>
      {loadError ? <p className="rounded-xl bg-white p-4 text-sm">{loadError}</p> : null}
      {warning ? <p role="status" className="rounded-xl border border-neuro-orange/40 bg-white p-4 text-sm">{warning}</p> : null}
      {message ? <p className="rounded-xl bg-white p-4 text-sm">{message}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => setFilter('open')} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${filter === 'open' ? 'bg-neuro-orange text-white' : 'bg-white'}`}>Needs a decision</button>
        <button type="button" onClick={() => setFilter('all')} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${filter === 'all' ? 'bg-neuro-orange text-white' : 'bg-white'}`}>All</button>
      </div>
      {visible.length === 0 ? <p className="text-sm">No applications in this list.</p> : null}
      {visible.map((row) => (
        <article key={row.id} className="space-y-3 rounded-2xl bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">{row.name}</h2>
              <p className="text-sm">{row.email || 'No email'}</p>
              <p className="text-sm">{[row.city, row.country].filter(Boolean).join(', ') || 'No city yet'}</p>
            </div>
            <p className="text-sm font-bold">{row.status.replaceAll('_', ' ')}</p>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-bold">Plan</dt><dd>{row.plan} · {row.priceLabel}</dd></div>
            <div><dt className="font-bold">Card on file</dt><dd>{row.cardOnFile ? 'Yes' : 'No'}</dd></div>
            <div><dt className="font-bold">Where they stopped</dt><dd>{row.stoppedAt}</dd></div>
            <div><dt className="font-bold">Mobile</dt><dd>{row.mobile || 'Not given'}</dd></div>
            <div><dt className="font-bold">Text consent</dt><dd>{row.smsConsent}</dd></div>
            <div><dt className="font-bold">Years in practice</dt><dd>{row.years ?? '—'}</dd></div>
            <div><dt className="font-bold">Scans</dt><dd>{row.scans}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Approach</dt><dd>{row.approach || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Techniques</dt><dd>{row.techniques || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Office</dt><dd>{row.address || '—'}</dd></div>
            <div><dt className="font-bold">Website</dt><dd>{row.website || '—'}</dd></div>
            <div><dt className="font-bold">Instagram</dt><dd>{row.instagram || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">How they heard</dt><dd>{row.heardAbout || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Why they want to join</dt><dd>{row.whyJoin || '—'}</dd></div>
          </dl>
          <label className="block text-sm font-bold">
            Notes, optional
            <textarea
              value={notes[row.id] ?? row.notes}
              onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
              className="mt-1 min-h-20 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          {row.status === 'approved' || row.status === 'declined' ? null : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== '' || !row.cardOnFile}
                onClick={() => void run(row.id, 'approve')}
                className="min-h-11 rounded-xl bg-neuro-orange px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy === `approve:${row.id}` ? 'Approving…' : 'Approve and charge'}
              </button>
              <button
                type="button"
                disabled={busy !== ''}
                onClick={() => void run(row.id, 'decline')}
                className="min-h-11 rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy === `decline:${row.id}` ? 'Declining…' : 'Decline'}
              </button>
            </div>
          )}
          {!row.cardOnFile && row.status !== 'approved' && row.status !== 'declined' ? (
            <p className="text-sm">Approve stays off until a card is saved.</p>
          ) : null}
        </article>
      ))}
    </div>
  )
}
