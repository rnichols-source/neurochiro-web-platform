'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { rerouteWaitingAction } from '@/app/(admin)/admin/founder-actions'
import type { DoctorListRow } from '@/lib/founder/model'
import type { ApplicationRecord, PersonRecord, SubscriberRecord } from '@/lib/founder/roster'

type Tab = 'doctors' | 'applications' | 'members' | 'subscribers' | 'students'
type ApplicationRow = ApplicationRecord & { displayName?: string }

export function PeopleBoard({
  doctors,
  applications,
  members,
  subscribers,
  students,
  initialTab,
  initialId,
  initialFilter = 'live',
  paidKnown = true,
  remindersKnown = true,
}: {
  doctors: DoctorListRow[]
  applications: ApplicationRow[]
  members: PersonRecord[]
  subscribers: SubscriberRecord[]
  students: PersonRecord[]
  initialTab: Tab
  initialId: string
  initialFilter?: string
  paidKnown?: boolean
  remindersKnown?: boolean
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(initialFilter)
  const [selected, setSelected] = useState(initialId)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const needle = query.trim().toLowerCase()

  const shownDoctors = useMemo(() => doctors.filter((row) => {
    if (filter === 'live' && row.listing !== 'live') return false
    if (filter === 'hidden' && row.listing === 'live') return false
    if (filter === 'unpaid' && !paidKnown) return false
    if (filter === 'unpaid' && (row.listing !== 'live' || row.paid)) return false
    if (filter === 'risk' && row.tone === 'ok') return false
    if (filter === 'ignoring' && row.waiting < 1) return false
    if (filter === 'founding' && (!row.founding || row.listing !== 'live')) return false
    if (!needle) return true
    return `${row.name} ${row.where} ${row.plan} ${row.email || ''}`.toLowerCase().includes(needle)
  }), [doctors, filter, needle, paidKnown])

  const picked = doctors.find((row) => row.id === selected) || null
  const desktopDoctor = picked || shownDoctors[0] || null
  const ignoring = doctors.filter((row) => row.waiting > 0).length
  const founding = doctors.filter((row) => row.founding && row.listing === 'live').length
  const liveCount = doctors.filter((row) => row.listing === 'live').length

  const tabs: { id: Tab; label: string }[] = [
    { id: 'doctors', label: `Doctors ${liveCount} live` },
    { id: 'applications', label: `Applications ${applications.length}` },
    { id: 'members', label: `Patients ${members.length}` },
    { id: 'subscribers', label: `Subscribers ${subscribers.filter((row) => row.confirmed).length}` },
    { id: 'students', label: `Students ${students.length}` },
  ]

  return (
    <>
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="rounded-[22px] bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`fd-ui min-h-11 rounded-full px-3 text-[13px] font-extrabold ${tab === item.id ? 'bg-[#0E857A] text-white' : 'bg-[#F5F3EF] text-[#0A6159]'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, city, clinic, email" className="mb-3 min-h-11 w-full rounded-xl border border-[#D7DEE6] px-3 text-[14px] outline-none" />
          {tab === 'doctors' ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  ['live', 'Live'],
                  ['hidden', 'Hidden or pending'],
                  ['all', 'All'],
                  ['unpaid', 'No paid plan'],
                  ['risk', 'At risk'],
                  ['ignoring', `Ignoring requests ${ignoring}`],
                  ['founding', `Founding ${founding}`],
                ].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setFilter(id)} className={`fd-ui min-h-10 rounded-full px-3 text-[13px] font-bold ${filter === id ? 'bg-[#DCF1EE] text-[#0A6159]' : 'bg-[#F5F3EF] text-[#5b6773]'}`}>{label}</button>
                ))}
              </div>
              {filter === 'unpaid' && !paidKnown ? <p className="mb-3 text-[14px] text-[#B4501A]">Could not check who has a paid plan. This list is not a count of zero.</p> : null}
              <div className="hidden grid-cols-[1.4fr_.7fr_1fr_.8fr_.45fr_.55fr_.45fr] gap-2 px-2 pb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#8a95a1] lg:grid">
                <span>Doctor</span><span>Status</span><span>Where</span><span>Plan</span><span>Requests</span><span>Reply</span><span>Health</span>
              </div>
              <div className="lg:max-h-[640px] lg:overflow-y-auto">
                {shownDoctors.map((row) => (
                  <button key={row.id} type="button" onClick={() => setSelected(row.id)} className={`grid w-full gap-1 border-b border-[#F3F1EC] px-2 py-3 text-left lg:grid-cols-[1.4fr_.7fr_1fr_.8fr_.45fr_.55fr_.45fr] lg:items-center ${picked?.id === row.id ? 'rounded-xl bg-[#F2FAF8] outline outline-2 outline-[#0E857A]' : ''}`}>
                    <span className="fd-ui text-[14px] font-extrabold">{row.name}</span>
                    <span className={`fd-ui w-fit rounded-full px-2 py-0.5 text-[12px] font-extrabold ${row.listing === 'live' ? 'bg-[#DDF3E6] text-[#1E7A45]' : 'bg-[#F3F1EC] text-[#5b6773]'}`}>{listingLabel(row.listing)}</span>
                    <span className="text-[13px] text-[#5b6773]">{row.where}</span>
                    <span className="text-[13px]">{row.plan}</span>
                    <span className="text-[13px]">{row.requests}</span>
                    <span className="text-[13px]">{row.reply}</span>
                    <span className={`fd-ui w-fit rounded-full px-2 py-0.5 text-[12px] font-extrabold ${row.tone === 'ok' ? 'bg-[#DDF3E6] text-[#1E7A45]' : row.tone === 'warn' ? 'bg-[#FBF1DC] text-[#8A5A0F]' : 'bg-[#FDECEA] text-[#B3261E]'}`}>{row.health}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-[#8a95a1]">The list opens on live doctors. Hidden, pending, and unverified stay behind the other filters. Health uses waiting requests, replies, sign-in, and photo.</p>
            </>
          ) : null}
          {tab === 'applications' ? <SimpleList rows={applications.filter((row) => `${row.displayName || ''} ${row.status} ${row.city} ${row.state}`.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: row.displayName || 'Doctor application', detail: applicationDetail(row, remindersKnown), href: '/admin/applications' }))} /> : null}
          {tab === 'members' ? <SimpleList linked={false} rows={members.filter((row) => `${row.name} ${row.email || ''}`.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: row.name, detail: row.email || 'No email', href: '' }))} /> : null}
          {tab === 'subscribers' ? <SimpleList rows={subscribers.filter((row) => row.email.includes(needle) || row.state.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: row.email, detail: row.confirmed ? 'Confirmed' : row.status || 'Not confirmed', href: '/admin/leads?tab=waitlist' }))} /> : null}
          {tab === 'students' ? <SimpleList rows={students.filter((row) => `${row.name} ${row.email || ''}`.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: row.name, detail: row.email || 'No email', href: '/admin/students/calls' }))} /> : null}
        </section>
        {tab === 'doctors' && desktopDoctor ? (
          <aside className="hidden rounded-[22px] bg-white p-5 lg:block">
            <DoctorDetail doctor={desktopDoctor} busy={busy} message={message} onReroute={async () => {
              setBusy(true)
              const result = await rerouteWaitingAction(desktopDoctor.id, desktopDoctor.waiting)
              setMessage(result.message)
              setBusy(false)
            }} />
          </aside>
        ) : (
          <aside className="hidden rounded-[22px] bg-white p-5 text-[14px] text-[#5b6773] lg:block">
            Pick a doctor to see health, the timeline, and the next action.
          </aside>
        )}
      </div>
      {tab === 'doctors' && picked ? (
        <div className="fixed inset-x-0 bottom-16 z-30 max-h-[75vh] overflow-y-auto rounded-t-3xl border border-[#E6E2DB] bg-white p-5 shadow-2xl lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <p className="fd-ui text-[12px] font-extrabold uppercase tracking-wide text-[#8a95a1]">Doctor</p>
            <button type="button" onClick={() => setSelected('')} className="fd-ui min-h-11 rounded-xl px-3 text-[13px] font-extrabold text-[#0A6159]">Close</button>
          </div>
          <DoctorDetail doctor={picked} busy={busy} message={message} onReroute={async () => {
            setBusy(true)
            const result = await rerouteWaitingAction(picked.id, picked.waiting)
            setMessage(result.message)
            setBusy(false)
          }} />
        </div>
      ) : null}
    </>
  )
}

function listingLabel(listing: DoctorListRow['listing']): string {
  if (listing === 'live') return 'Live'
  if (listing === 'hidden') return 'Hidden'
  if (listing === 'pending') return 'Pending'
  return 'Unverified'
}

function applicationDetail(row: ApplicationRow, remindersKnown: boolean): string {
  const place = [row.city, row.state].filter(Boolean).join(', ')
  const reminder = !remindersKnown
    ? 'last reminder could not be checked'
    : row.lastReminder
      ? `last reminder ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(new Date(row.lastReminder))}`
      : 'no reminder sent yet'
  return [row.status.replaceAll('_', ' '), place, row.status === 'draft' ? reminder : ''].filter(Boolean).join(' · ')
}

function DoctorDetail({ doctor, busy, message, onReroute }: { doctor: DoctorListRow; busy: boolean; message: string; onReroute: () => Promise<void> }) {
  return (
    <>
      <h2 className="fd-ui text-[19px] font-extrabold">{doctor.name}</h2>
      <p className="text-[13px] text-[#5b6773]">{listingLabel(doctor.listing)} · {doctor.where} · {doctor.plan}{doctor.paid ? '' : ' · no paid plan on file'}</p>
      <div className="mt-3 rounded-2xl bg-[#FBF1DC] p-3">
        <p className="fd-ui text-[14px] font-extrabold">Health score {doctor.health}</p>
        <p className="text-[13px] text-[#5b4210]">{doctor.reasons.join(' · ')}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat n={doctor.requests} label="requests" />
        <Stat n={doctor.confirmed} label="confirmed" />
        <Stat n={doctor.views} label="profile views" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/admin/inbox" className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">Message</Link>
        {doctor.email ? <a href={`mailto:${doctor.email}`} className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">Email</a> : <span className="flex min-h-11 items-center justify-center text-[12px] text-[#8a95a1]">No email</span>}
        {doctor.phone ? <a href={`tel:${doctor.phone}`} className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">Text</a> : <span className="flex min-h-11 items-center justify-center text-[12px] text-[#8a95a1]">No phone</span>}
        <Link href={`/admin/people/preview/${doctor.id}`} className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">View as doctor</Link>
      </div>
      {doctor.waiting > 0 ? (
        <button
          type="button"
          disabled={busy}
          className="fd-ui mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0E857A] text-[14px] font-extrabold text-white disabled:opacity-60"
          onClick={async () => {
            if (!window.confirm(`Reroute waiting requests for ${doctor.name} to the next closest live doctor?\n\nOnly requests with a saved place can move. The button confirms the number the server can place.`)) return
            await onReroute()
          }}
        >
          Reroute the {doctor.waiting} waiting request{doctor.waiting === 1 ? '' : 's'}
        </button>
      ) : null}
      {message ? <p className="mt-2 text-[13px] text-[#0A6159]">{message}</p> : null}
      <div className="mt-4">
        <p className="fd-ui text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8a95a1]">Timeline</p>
        {doctor.timeline.map((line) => <p key={line} className="py-1 text-[13px] text-[#4a5865]">{line}</p>)}
      </div>
      <Link href={`/admin/members?q=${encodeURIComponent(doctor.name.replace(/^Dr\.\s*/, ''))}`} className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold text-[#0A6159]">Edit this doctor</Link>
    </>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div className="rounded-xl bg-[#F5F3EF] p-2"><b className="fd-ui block text-[18px]">{n}</b><span className="text-[11px] text-[#6b7785]">{label}</span></div>
}

function SimpleList({ rows, linked = true }: { rows: { id: string; title: string; detail: string; href: string }[]; linked?: boolean }) {
  if (!rows.length) return <p className="text-[14px] text-[#6b7785]">Nothing in this list.</p>
  return (
    <div className="max-h-[640px] overflow-y-auto">
      {rows.slice(0, 200).map((row) => linked && row.href ? (
        <Link key={row.id} href={row.href} className="flex min-h-12 items-center justify-between gap-3 border-b border-[#F3F1EC] py-2">
          <span>
            <span className="fd-ui block text-[14px] font-extrabold">{row.title}</span>
            <span className="text-[12px] text-[#6b7785]">{row.detail}</span>
          </span>
        </Link>
      ) : (
        <div key={row.id} className="flex min-h-12 items-center justify-between gap-3 border-b border-[#F3F1EC] py-2">
          <span>
            <span className="fd-ui block text-[14px] font-extrabold">{row.title}</span>
            <span className="text-[12px] text-[#6b7785]">{row.detail}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
