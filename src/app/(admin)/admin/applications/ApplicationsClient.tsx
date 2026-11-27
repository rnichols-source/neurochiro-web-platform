'use client'

import { useState } from 'react'
import type { AdminApplicationRow } from '@/lib/applications/admin-row'
import { applicationQueue } from '@/lib/applications/status'
import { approveDoctorApplication, declineDoctorApplication } from './actions'

function activityLabel(iso: string): string {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return 'No activity yet'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date) + ' UTC'
}

export function ApplicationsClient({
  rows,
  loadError,
  initialNotice = '',
  initialQueue = 'decision',
}: {
  rows: AdminApplicationRow[]
  loadError: string | null
  initialNotice?: string
  initialQueue?: 'decision' | 'progress' | 'all'
}) {
  const [filter, setFilter] = useState<'decision' | 'progress' | 'all'>(initialQueue)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [warning, setWarning] = useState(initialNotice)
  const [busy, setBusy] = useState('')

  const visible = rows.filter((row) => filter === 'all' || applicationQueue(row.status) === filter)

  function confirmAction(row: AdminApplicationRow, kind: 'approve' | 'decline'): boolean {
    if (kind === 'decline') {
      return window.confirm(`Decline ${row.name}? This emails them, takes the card off file, and refunds a payment if one was already taken.`)
    }
    if (row.paymentReceived) {
      return window.confirm(`Publish ${row.name}'s profile? The card will not be charged again. They will get an email.`)
    }
    return window.confirm(`Charge ${row.name} (${row.priceLabel}) and publish the profile? They will get an email.`)
  }

  async function run(id: string, kind: 'approve' | 'decline') {
    const row = rows.find((item) => item.id === id)
    if (!row || !confirmAction(row, kind)) return
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
          Needs a decision is under review or a charge that still needs a step. In progress is a draft, with the step they reached and the last time it was saved. Approve and charge appears only when every required field and a card are on file. A payment-link payment is already approved.
        </p>
      </div>
      {loadError ? <p className="rounded-xl bg-white p-4 text-sm">{loadError}</p> : null}
      {warning ? <p role="status" className="rounded-xl border border-neuro-orange/40 bg-white p-4 text-sm">{warning}</p> : null}
      {message ? <p className="rounded-xl bg-white p-4 text-sm">{message}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => setFilter('decision')} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${filter === 'decision' ? 'bg-neuro-orange text-white' : 'bg-white'}`}>Needs a decision</button>
        <button type="button" onClick={() => setFilter('progress')} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${filter === 'progress' ? 'bg-neuro-orange text-white' : 'bg-white'}`}>In progress</button>
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
            <div><dt className="font-bold">Step reached</dt><dd>{row.stoppedAt}</dd></div>
            <div><dt className="font-bold">Last activity</dt><dd>{activityLabel(row.lastActivity)}</dd></div>
            <div><dt className="font-bold">Mobile</dt><dd>{row.mobile || 'Not given'}</dd></div>
            <div><dt className="font-bold">Text consent</dt><dd>{row.smsConsent}</dd></div>
            <div><dt className="font-bold">Payment</dt><dd>{row.paymentReceived ? 'Received. Approve will not charge again' : 'Not received'}</dd></div>
            {row.status === 'draft' ? <div className="sm:col-span-2"><dt className="font-bold">Last reminder</dt><dd>{row.lastContacted ? activityLabel(row.lastContacted) : 'No reminder sent yet'}</dd></div> : null}
            <div><dt className="font-bold">Years in practice</dt><dd>{row.years ?? '—'}</dd></div>
            <div><dt className="font-bold">Scans</dt><dd>{row.scans}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Approach</dt><dd>{row.approach || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Techniques</dt><dd>{row.techniques || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Office</dt><dd>{row.address || '—'}</dd></div>
            <div><dt className="font-bold">Website</dt><dd>{row.website || '—'}</dd></div>
            <div><dt className="font-bold">Instagram</dt><dd>{row.instagram || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="font-bold">Referred by</dt><dd>{row.referredBy || '—'}</dd></div>
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
          {applicationQueue(row.status) === 'decision' ? (
            <div className="space-y-3">
              {row.complete ? (
                <button
                  type="button"
                  disabled={busy !== ''}
                  onClick={() => void run(row.id, 'approve')}
                  className="min-h-11 rounded-xl bg-neuro-orange px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busy === `approve:${row.id}` ? 'Approving…' : row.paymentReceived ? 'Approve and publish' : 'Approve and charge'}
                </button>
              ) : (
                <div>
                  <p className="text-sm font-bold">Missing</p>
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {row.missing.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              <button
                type="button"
                disabled={busy !== ''}
                onClick={() => void run(row.id, 'decline')}
                className="min-h-11 rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy === `decline:${row.id}` ? 'Declining…' : 'Decline'}
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
