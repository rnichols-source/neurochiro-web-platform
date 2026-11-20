'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { nudgeHomePlan } from '@/lib/doctor/pipeline-actions'
import { followFlags, followStatusLabel, type FollowCounts, type FollowRow } from '@/lib/doctor/follow-through'

const FILTERS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'opened', label: 'Opened' },
  { id: 'following', label: 'Following this week' },
  { id: 'slipping', label: 'Slipping' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

export function FollowThroughView({
  rows,
  counts,
  nowIso,
  timeZone,
}: {
  rows: FollowRow[]
  counts: FollowCounts
  nowIso: string
  timeZone: string
}) {
  const now = new Date(nowIso)
  const router = useRouter()
  const [filter, setFilter] = useState<FilterId>(counts.slipping > 0 ? 'slipping' : 'recommended')
  const [note, setNote] = useState('')
  const [pending, start] = useTransition()
  const numbers: Record<FilterId, number> = {
    recommended: counts.recommended,
    opened: counts.opened,
    following: counts.following,
    slipping: counts.slipping,
  }
  const shown = rows.filter((row) => {
    if (filter === 'recommended') return true
    const flags = followFlags(row, now, timeZone)
    if (filter === 'opened') return flags.opened
    if (filter === 'following') return flags.following
    return flags.slipping
  })

  return (
    <section className="mt-4 rounded-[22px] bg-white p-4">
      <h2 className="dp-ui text-[18px] font-extrabold text-[#15202B]">Who is following the plan</h2>
      <p className="mt-1 text-[14px] text-[#5b6773]">Send a plan from People. This page shows who opened it, who did exercises this week, and who needs a nudge.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const on = filter === item.id
          return (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`dp-ui min-h-11 shrink-0 rounded-xl px-3 text-[13px] font-extrabold ${on ? 'bg-[#0E857A] text-white' : 'bg-[#DCF1EE] text-[#0A6159]'}`}>
              {item.label} <span className={`ml-1 rounded-full px-1.5 text-[12px] ${on ? 'bg-white/25' : 'bg-white'}`}>{numbers[item.id]}</span>
            </button>
          )
        })}
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 text-[14px] text-[#5b6773]">No one here yet. <Link href="/doctor/people" className="font-extrabold text-[#0A6159] underline">Open People and send a home plan.</Link></p>
      ) : (
        <ul className="mt-3 divide-y divide-[#ECEAE5]">
          {shown.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="dp-ui truncate text-[16px] font-extrabold text-[#15202B]">{row.name}</p>
                <p className="truncate text-[13px] text-[#5b6773]">{row.plan} · {followStatusLabel(row, now, timeZone)}</p>
              </div>
              {row.assignmentId ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => {
                    const result = await nudgeHomePlan(row.assignmentId || '')
                    setNote(result.ok ? (result.message || 'Nudge sent.') : result.error)
                    if (result.ok) router.refresh()
                  })}
                  className="dp-ui inline-flex h-11 items-center rounded-xl bg-[#0E857A] px-4 text-[14px] font-extrabold text-white"
                >
                  Nudge
                </button>
              ) : <span className="text-[13px] text-[#5b6773]">Invite sent</span>}
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="mt-2 text-[14px] text-[#15202B]" role="status">{note}</p> : null}
    </section>
  )
}
