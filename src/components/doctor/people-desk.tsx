'use client'

import Link from 'next/link'
import { useState } from 'react'
import { markVisitSeen } from '@/lib/community/actions'
import { initialsFrom } from '@/lib/doctor/places'
import type { PersonCard } from '@/lib/doctor/portal-data'
import { EmptyNote } from '@/components/doctor/chrome'

export function PeopleDesk({ waiting, members, ready }: { waiting: PersonCard[]; members: PersonCard[]; ready: boolean }) {
  const [tab, setTab] = useState<'waiting' | 'members'>('waiting')
  const rows = tab === 'waiting' ? waiting : members
  const [selectedId, setSelectedId] = useState(rows[0]?.id || '')
  const selected = rows.find((row) => row.id === selectedId) || rows[0] || null

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
      <div>
        <div className="flex gap-1 rounded-2xl bg-white p-1">
          <TabButton on={tab === 'waiting'} label="Waiting" count={waiting.length} onClick={() => { setTab('waiting'); setSelectedId(waiting[0]?.id || '') }} />
          <TabButton on={tab === 'members'} label="Your people" count={members.length} onClick={() => { setTab('members'); setSelectedId(members[0]?.id || '') }} />
        </div>
        {!ready ? <p className="mt-3 text-[14px] text-[#5b6773]">Visit requests are not on this database yet.</p> : null}
        {rows.length === 0 ? (
          <div className="mt-3">
            <EmptyNote
              title={tab === 'waiting' ? 'No visit requests' : 'No community members yet'}
              sentence={tab === 'waiting'
                ? 'When a community member asks to see you, they show up here.'
                : 'When someone chooses you as their home doctor, they show up here.'}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((row) => {
              const on = selected?.id === row.id
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`flex w-full items-center gap-3 rounded-[18px] bg-white px-3 py-3 text-left ${on ? 'outline outline-2 outline-[#2C6BB4]' : ''}`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E2ECF8] dp-ui text-[14px] font-extrabold text-[#1F4F8C]">{initialsFrom(row.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="dp-ui block truncate text-[16px] font-extrabold text-[#15202B]">{row.name}</span>
                      <span className="block truncate text-[13px] text-[#5b6773]">{row.detail}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <Link href="/doctor/leads" className="dp-ui mt-4 inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#1F4F8C]">Leads</Link>
      </div>
      <div>
        {selected ? (
          <article className="rounded-[26px] bg-white p-6 shadow-[0_14px_30px_-18px_rgba(21,32,43,0.3)]">
            <p className="dp-ui text-[12px] font-extrabold tracking-[0.1em] text-[#2C6BB4]" style={{ textTransform: 'uppercase' }}>{selected.kind === 'visit' ? 'Visit request' : 'Community member'}</p>
            <h2 className="dp-ui mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-[#15202B]">{selected.name}</h2>
            <p className="mt-1 text-[14px] text-[#5b6773]">{selected.detail}</p>
            {selected.note ? <p className="mt-4 rounded-2xl bg-[#F5F3EF] px-4 py-3 text-[15px] text-[#3d4a57]">{selected.note}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.profileId ? (
                <Link href={`/doctor/messages?to=${selected.profileId}`} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#2C6BB4] px-5 text-[15px] font-extrabold text-white">Message</Link>
              ) : null}
              <Link href={selected.kind === 'member' ? `/doctor/care-sets?member=${selected.profileId}` : '/doctor/network'} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#DCF1EE] px-5 text-[15px] font-extrabold text-[#0A6159]">
                {selected.kind === 'member' ? 'Assign a care set' : 'Refer'}
              </Link>
              {selected.kind === 'visit' && selected.status === 'requested' ? (
                <form action={markVisitSeen}>
                  <input type="hidden" name="id" value={selected.id} />
                  <button type="submit" className="dp-ui inline-flex h-[52px] items-center rounded-2xl border border-[#D7DEE6] bg-white px-5 text-[15px] font-extrabold text-[#3d4a57]">Mark seen</button>
                </form>
              ) : null}
            </div>
          </article>
        ) : (
          <EmptyNote title="Pick someone" sentence="The list on the left is everyone waiting, and the people who chose your office." />
        )}
      </div>
    </div>
  )
}

function TabButton({ on, label, count, onClick }: { on: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`dp-ui min-h-11 flex-1 rounded-xl text-[14px] font-extrabold ${on ? 'bg-[#2C6BB4] text-white' : 'text-[#5b6773]'}`}>
      {label} <span className={`ml-1 rounded-full px-1.5 text-[12px] ${on ? 'bg-white/25' : 'bg-[#ECEAE5]'}`}>{count}</span>
    </button>
  )
}
