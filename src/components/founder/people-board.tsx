'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { rerouteWaitingAction } from '@/app/(admin)/admin/founder-actions'
import type { DoctorListRow } from '@/lib/founder/model'
import type { ApplicationRecord, PersonRecord, SubscriberRecord } from '@/lib/founder/roster'

type Tab = 'doctors' | 'applications' | 'members' | 'subscribers' | 'students'

export function PeopleBoard({
  doctors,
  applications,
  members,
  subscribers,
  students,
  initialTab,
  initialId,
  initialFilter = 'all',
}: {
  doctors: DoctorListRow[]
  applications: ApplicationRecord[]
  members: PersonRecord[]
  subscribers: SubscriberRecord[]
  students: PersonRecord[]
  initialTab: Tab
  initialId: string
  initialFilter?: string
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(initialFilter)
  const [selected, setSelected] = useState(initialId)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const needle = query.trim().toLowerCase()

  const shownDoctors = useMemo(() => doctors.filter((row) => {
    if (filter === 'risk' && row.tone === 'ok') return false
    if (filter === 'ignoring' && row.waiting < 1) return false
    if (filter === 'founding' && !row.founding) return false
    if (!needle) return true
    return `${row.name} ${row.where} ${row.plan} ${row.email || ''}`.toLowerCase().includes(needle)
  }), [doctors, filter, needle])

  const doctor = doctors.find((row) => row.id === selected) || shownDoctors[0] || null
  const ignoring = doctors.filter((row) => row.waiting > 0).length
  const founding = doctors.filter((row) => row.founding).length

  const tabs: { id: Tab; label: string }[] = [
    { id: 'doctors', label: `Doctors ${doctors.length}` },
    { id: 'applications', label: `Applications ${applications.length}` },
    { id: 'members', label: `Community members ${members.length}` },
    { id: 'subscribers', label: `Subscribers ${subscribers.filter((row) => row.confirmed).length}` },
    { id: 'students', label: `Students ${students.length}` },
  ]

  return (
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
                ['all', 'All'],
                ['risk', 'At risk'],
                ['ignoring', `Ignoring requests ${ignoring}`],
                ['founding', `Founding ${founding}`],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setFilter(id)} className={`fd-ui min-h-10 rounded-full px-3 text-[13px] font-bold ${filter === id ? 'bg-[#DCF1EE] text-[#0A6159]' : 'bg-[#F5F3EF] text-[#5b6773]'}`}>{label}</button>
              ))}
            </div>
            <div className="hidden grid-cols-[1.5fr_1fr_.8fr_.5fr_.6fr_.5fr] gap-2 px-2 pb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#8a95a1] md:grid">
              <span>Doctor</span><span>Where</span><span>Plan</span><span>Requests</span><span>Reply</span><span>Health</span>
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              {shownDoctors.map((row) => (
                <button key={row.id} type="button" onClick={() => setSelected(row.id)} className={`grid w-full gap-1 border-b border-[#F3F1EC] px-2 py-3 text-left md:grid-cols-[1.5fr_1fr_.8fr_.5fr_.6fr_.5fr] md:items-center ${doctor?.id === row.id ? 'rounded-xl bg-[#F2FAF8] outline outline-2 outline-[#0E857A]' : ''}`}>
                  <span className="fd-ui text-[14px] font-extrabold">{row.name}</span>
                  <span className="text-[13px] text-[#5b6773]">{row.where}</span>
                  <span className="text-[13px]">{row.plan}</span>
                  <span className="text-[13px]">{row.requests}</span>
                  <span className="text-[13px]">{row.reply}</span>
                  <span className={`fd-ui w-fit rounded-full px-2 py-0.5 text-[12px] font-extrabold ${row.tone === 'ok' ? 'bg-[#DDF3E6] text-[#1E7A45]' : row.tone === 'warn' ? 'bg-[#FBF1DC] text-[#8A5A0F]' : 'bg-[#FDECEA] text-[#B3261E]'}`}>{row.health}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[#8a95a1]">Counts and rows are live. Health is a score from waiting requests, replies, sign-in, and photo.</p>
          </>
        ) : null}
        {tab === 'applications' ? <SimpleList rows={applications.filter((row) => `${row.status} ${row.city} ${row.state}`.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: [row.city, row.state].filter(Boolean).join(', ') || 'Application', detail: `${row.status}${row.plan ? ` · ${row.plan}` : ''}`, href: '/admin/applications' }))} /> : null}
        {tab === 'members' ? <SimpleList rows={members.filter((row) => `${row.name} ${row.email || ''}`.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: row.name, detail: row.email || 'No email', href: '/admin/leads' }))} /> : null}
        {tab === 'subscribers' ? <SimpleList rows={subscribers.filter((row) => row.email.includes(needle) || row.state.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: row.email, detail: row.confirmed ? 'Confirmed' : row.status || 'Not confirmed', href: '/admin/list' }))} /> : null}
        {tab === 'students' ? <SimpleList rows={students.filter((row) => `${row.name} ${row.email || ''}`.toLowerCase().includes(needle)).map((row) => ({ id: row.id, title: row.name, detail: row.email || 'No email', href: '/admin/students/calls' }))} /> : null}
      </section>
      {tab === 'doctors' && doctor ? (
        <aside className="rounded-[22px] bg-white p-5">
          <h2 className="fd-ui text-[19px] font-extrabold">{doctor.name}</h2>
          <p className="text-[13px] text-[#5b6773]">{doctor.where} · {doctor.plan}</p>
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
            <Link prefetch href={`/admin/inbox`} className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">Message</Link>
            {doctor.email ? <a href={`mailto:${doctor.email}`} className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">Email</a> : <span className="flex min-h-11 items-center justify-center text-[12px] text-[#8a95a1]">No email</span>}
            {doctor.phone ? <a href={`tel:${doctor.phone}`} className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">Text</a> : <span className="flex min-h-11 items-center justify-center text-[12px] text-[#8a95a1]">No phone</span>}
            <Link prefetch href={`/admin/people/preview/${doctor.id}`} className="fd-ui flex min-h-11 items-center justify-center rounded-xl border-2 border-[#D7DEE6] text-[13px] font-extrabold">View as doctor</Link>
          </div>
          {doctor.waiting > 0 ? (
            <button
              type="button"
              disabled={busy}
              className="fd-ui mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0E857A] text-[14px] font-extrabold text-white disabled:opacity-60"
              onClick={async () => {
                const placeNote = 'Only requests with a saved place can move. The button confirms the number the server can place.'
                if (!window.confirm(`Reroute waiting requests for ${doctor.name} to the next closest live doctor?\n\n${placeNote}`)) return
                setBusy(true)
                const result = await rerouteWaitingAction(doctor.id, doctor.waiting)
                setMessage(result.message)
                setBusy(false)
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
          <Link prefetch href={`/admin/members?q=${encodeURIComponent(doctor.name.replace(/^Dr\.\s*/, ''))}`} className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold text-[#0A6159]">Open the full member editor</Link>
        </aside>
      ) : (
        <aside className="rounded-[22px] bg-white p-5 text-[14px] text-[#5b6773]">
          Pick a doctor to see health, the timeline, and the next action. Other lists open the existing editor.
        </aside>
      )}
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div className="rounded-xl bg-[#F5F3EF] p-2"><b className="fd-ui block text-[18px]">{n}</b><span className="text-[11px] text-[#6b7785]">{label}</span></div>
}

function SimpleList({ rows }: { rows: { id: string; title: string; detail: string; href: string }[] }) {
  if (!rows.length) return <p className="text-[14px] text-[#6b7785]">Nothing in this list.</p>
  return (
    <div className="max-h-[640px] overflow-y-auto">
      {rows.slice(0, 200).map((row) => (
        <Link prefetch key={row.id} href={row.href} className="flex min-h-12 items-center justify-between gap-3 border-b border-[#F3F1EC] py-2">
          <span>
            <span className="fd-ui block text-[14px] font-extrabold">{row.title}</span>
            <span className="text-[12px] text-[#6b7785]">{row.detail}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}
