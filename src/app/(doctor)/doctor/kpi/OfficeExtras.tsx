'use client'

import { useState } from 'react'
import { weekdayName } from '@/lib/kpi/calendar'
import type { OfficeMember } from '@/lib/kpi/types'

const DAYS = [1, 2, 3, 4, 5, 6, 0]

export default function OfficeExtras({
  openWeekdays,
  closedDates,
  isOwner,
  members,
  onSaveWeekdays,
  onAddClosed,
  onRemoveClosed,
  onInvite,
  onRemoveMember,
}: {
  openWeekdays: number[]
  closedDates: string[]
  isOwner: boolean
  members: OfficeMember[]
  onSaveWeekdays: (days: number[]) => Promise<{ ok: boolean; error?: string }>
  onAddClosed: (date: string, note: string) => Promise<{ ok: boolean; error?: string }>
  onRemoveClosed: (date: string) => Promise<{ ok: boolean; error?: string }>
  onInvite: (email: string, role: 'associate' | 'front_desk', canViewPl: boolean) => Promise<{ ok: boolean; error?: string }>
  onRemoveMember: (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [days, setDays] = useState(openWeekdays)
  const [closedOn, setClosedOn] = useState('')
  const [note, setNote] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'associate' | 'front_desk'>('front_desk')
  const [canViewPl, setCanViewPl] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOwner) {
    return (
      <section className="rounded-2xl border border-portal-border bg-white p-4">
        <p className="text-sm text-portal-ink-2">You can enter and view this office’s numbers. The doctor sets the goals, the closed days, and who else can sign in.</p>
      </section>
    )
  }

  return (
    <div className="space-y-4" data-testid="kpi-office">
      <section className="rounded-2xl border border-portal-border bg-white p-4 space-y-3">
        <h2 className="font-bold text-portal-ink">Days the office is open</h2>
        <p className="text-sm text-portal-ink-2">Closed days are left out of goals, streaks, and averages. A day you open anyway still counts in the totals if you enter numbers.</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const on = days.includes(day)
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setDays((current) => {
                    if (current.includes(day)) return current.filter((item) => item !== day)
                    return [...current, day].sort((a, b) => a - b)
                  })
                }}
                className={`min-h-11 min-w-11 rounded-lg px-3 text-sm font-bold ${on ? 'bg-portal-accent text-white' : 'bg-portal-surface text-portal-ink'}`}
              >
                {weekdayName(day)}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-portal-ink px-4 text-sm font-bold text-white"
          onClick={async () => {
            setError(null)
            setMessage(null)
            if (days.length === 0) {
              setError('Leave at least one day open.')
              return
            }
            const result = await onSaveWeekdays(days)
            if (!result.ok) setError(result.error || 'Could not save the open days.')
            else setMessage('Open days saved')
          }}
        >
          Save open days
        </button>
        <label className="block text-sm font-bold text-portal-ink-2">
          Mark a date closed
          <input type="date" value={closedOn} onChange={(event) => setClosedOn(event.target.value)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border px-3 text-base text-portal-ink" />
        </label>
        <label className="block text-sm font-bold text-portal-ink-2">
          Note, if you want one
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Holiday" className="mt-1 w-full min-h-11 rounded-lg border border-portal-border px-3 text-base text-portal-ink" />
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink"
          onClick={async () => {
            setError(null)
            setMessage(null)
            const result = await onAddClosed(closedOn, note)
            if (!result.ok) setError(result.error || 'Could not mark that day closed.')
            else {
              setClosedOn('')
              setNote('')
              setMessage('Day marked closed')
            }
          }}
        >
          Add closed day
        </button>
        {closedDates.length === 0 ? <p className="text-sm text-portal-muted">No extra closed dates.</p> : (
          <ul className="space-y-2">
            {closedDates.map((date) => (
              <li key={date} className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-portal-ink">{date}</span>
                <button type="button" className="min-h-11 px-3 text-sm font-bold text-portal-accent" onClick={() => onRemoveClosed(date)}>Reopen</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-2xl border border-portal-border bg-white p-4 space-y-3" data-testid="kpi-team">
        <h2 className="font-bold text-portal-ink">Office team</h2>
        <p className="text-sm text-portal-ink-2">An associate or the front desk can enter and view this scorecard. They do not get billing, profile editing, or the P&L unless you allow the P&L comparison.</p>
        <label className="block text-sm font-bold text-portal-ink-2">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border px-3 text-base text-portal-ink" />
        </label>
        <label className="block text-sm font-bold text-portal-ink-2">
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as 'associate' | 'front_desk')} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border bg-white px-3 text-base text-portal-ink">
            <option value="front_desk">Front desk</option>
            <option value="associate">Associate</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-portal-ink">
          <input type="checkbox" checked={canViewPl} onChange={(event) => setCanViewPl(event.target.checked)} />
          They can see the P&L comparison
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-portal-accent px-4 text-sm font-bold text-white"
          onClick={async () => {
            setError(null)
            setMessage(null)
            const result = await onInvite(email, role, canViewPl)
            if (!result.ok) setError(result.error || 'Could not send that invite.')
            else {
              setEmail('')
              setMessage('Invited. They sign in with that email, then open the scorecard.')
            }
          }}
        >
          Invite
        </button>
        {members.length === 0 ? <p className="text-sm text-portal-muted">No one else is invited yet.</p> : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-portal-surface px-3 py-2">
                <div>
                  <p className="text-sm font-bold text-portal-ink">{member.email}</p>
                  <p className="text-sm text-portal-ink-2">{member.role === 'front_desk' ? 'Front desk' : 'Associate'} · {member.status === 'active' ? 'Signed in' : 'Invited'}{member.canViewPl ? ' · P&L comparison' : ''}</p>
                </div>
                <button type="button" className="min-h-11 px-2 text-sm font-bold text-portal-danger" onClick={() => onRemoveMember(member.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {message ? <p className="rounded-lg bg-portal-success-bg px-3 py-2 text-sm font-bold text-portal-success" role="status">{message}</p> : null}
      {error ? <p className="rounded-lg bg-portal-danger-bg px-3 py-2 text-sm font-bold text-portal-danger" role="status">{error}</p> : null}
    </div>
  )
}
