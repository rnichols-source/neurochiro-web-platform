'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { updateLeadStage } from '@/app/(doctor)/doctor/leads/actions'
import { markVisitSeen } from '@/lib/community/actions'
import { initialsFrom } from '@/lib/doctor/places'
import type { PersonCard } from '@/lib/doctor/portal-data'
import { EmptyNote } from '@/components/doctor/chrome'

const FILTERS = [
  { id: 'all', label: 'Everyone' },
  { id: 'requests', label: 'Requests' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'care', label: 'Care sets' },
  { id: 'messages', label: 'Messages' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

function matches(row: PersonCard, filter: FilterId) {
  if (filter === 'all') return true
  if (filter === 'requests') return row.kind === 'visit' || row.kind === 'request' || row.kind === 'member'
  if (filter === 'referrals') return row.kind === 'referral'
  if (filter === 'care') return row.kind === 'care'
  return row.kind === 'message'
}

export function PeopleDesk({ people, ready, initialFilter }: { people: PersonCard[]; ready: boolean; initialFilter?: string }) {
  const starting = FILTERS.some((item) => item.id === initialFilter) ? initialFilter as FilterId : 'all'
  const [filter, setFilter] = useState<FilterId>(starting)
  const rows = useMemo(() => people.filter((row) => matches(row, filter)), [people, filter])
  const [selectedId, setSelectedId] = useState(rows[0]?.id || '')
  const selected = rows.find((row) => row.id === selectedId) || rows[0] || null
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
      <div>
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1">
          {FILTERS.map((item) => {
            const count = people.filter((row) => matches(row, item.id)).length
            const on = filter === item.id
            return (
              <button key={item.id} type="button" onClick={() => { setFilter(item.id); const next = people.filter((row) => matches(row, item.id)); setSelectedId(next[0]?.id || '') }} className={`dp-ui min-h-11 shrink-0 rounded-xl px-3 text-[13px] font-extrabold ${on ? 'bg-[#2C6BB4] text-white' : 'text-[#5b6773]'}`}>
                {item.label} <span className={`ml-1 rounded-full px-1.5 text-[12px] ${on ? 'bg-white/25' : 'bg-[#ECEAE5]'}`}>{count}</span>
              </button>
            )
          })}
        </div>
        {!ready ? <p className="mt-3 text-[14px] text-[#5b6773]">Some people lists are not on this database yet.</p> : null}
        {rows.length === 0 ? (
          <div className="mt-3">
            <EmptyNote title="No one in this list" sentence="Directory requests, referrals, care sets, and messages show up here." />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((row) => {
              const on = selected?.id === row.id
              return (
                <li key={row.id}>
                  <button type="button" onClick={() => setSelectedId(row.id)} className={`flex w-full items-center gap-3 rounded-[18px] bg-white px-3 py-3 text-left ${on ? 'outline outline-2 outline-[#2C6BB4]' : ''}`}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E2ECF8] dp-ui text-[14px] font-extrabold text-[#1F4F8C]">{initialsFrom(row.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="dp-ui block truncate text-[16px] font-extrabold text-[#15202B]">{row.name}</span>
                      <span className="block truncate text-[13px] text-[#5b6773]">{row.detail}</span>
                    </span>
                    <span className="dp-ui rounded-full bg-[#F5F3EF] px-2 py-1 text-[11px] font-extrabold text-[#3d4a57]">{row.status}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div>
        {selected ? (
          <article className="rounded-[26px] bg-white p-6 shadow-[0_14px_30px_-18px_rgba(21,32,43,0.3)]">
            <p className="dp-ui text-[12px] font-extrabold tracking-[0.1em] text-[#2C6BB4]" style={{ textTransform: 'uppercase' }}>{selected.kind.replace('_', ' ')}</p>
            <h2 className="dp-ui mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-[#15202B]">{selected.name}</h2>
            <p className="mt-1 text-[14px] text-[#5b6773]">{selected.detail}</p>
            <p className="mt-2 text-[13px] font-bold text-[#15202B]">Status: {selected.status}</p>
            {selected.note ? <p className="mt-4 rounded-2xl bg-[#F5F3EF] px-4 py-3 text-[15px] text-[#3d4a57]">{selected.note}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.profileId ? (
                <Link href={`/doctor/messages?to=${selected.profileId}`} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#2C6BB4] px-5 text-[15px] font-extrabold text-white">Message</Link>
              ) : null}
              {selected.href ? (
                <Link href={selected.href} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#E2ECF8] px-5 text-[15px] font-extrabold text-[#1F4F8C]">Open</Link>
              ) : null}
              {selected.kind === 'member' || selected.kind === 'care' ? (
                <Link href={selected.profileId ? `/doctor/care-sets?member=${selected.profileId}` : '/doctor/care-sets'} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#DCF1EE] px-5 text-[15px] font-extrabold text-[#0A6159]">Send a care set</Link>
              ) : null}
              {selected.leadId ? (
                <button type="button" disabled={pending} onClick={() => start(async () => { const result = await updateLeadStage(selected.leadId || '', 'contacted', selected.leadType); setNote(result?.error || 'Marked contacted.') })} className="dp-ui inline-flex h-[52px] items-center rounded-2xl border border-[#D7DEE6] bg-white px-5 text-[15px] font-extrabold text-[#3d4a57]">Mark contacted</button>
              ) : null}
              {selected.kind === 'visit' && selected.status === 'requested' ? (
                <form action={markVisitSeen}>
                  <input type="hidden" name="id" value={selected.id} />
                  <button type="submit" className="dp-ui inline-flex h-[52px] items-center rounded-2xl border border-[#D7DEE6] bg-white px-5 text-[15px] font-extrabold text-[#3d4a57]">Mark seen</button>
                </form>
              ) : null}
            </div>
            {note ? <p className="mt-3 text-[14px] text-[#15202B]">{note}</p> : null}
          </article>
        ) : (
          <EmptyNote title="Pick someone" sentence="Everyone waiting is listed here, along with the people who chose your office." />
        )}
      </div>
    </div>
  )
}
