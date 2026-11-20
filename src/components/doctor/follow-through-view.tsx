'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { nudgeHomePlan, nudgeRemedy } from '@/lib/doctor/pipeline-actions'
import {
  boardStatus,
  followCounts,
  frequencyLabel,
  sortFollowRows,
  type BoardTone,
  type FollowRow,
} from '@/lib/doctor/follow-through'
import { agoLabel } from '@/lib/doctor/places'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'green', label: 'On track' },
  { id: 'yellow', label: 'Falling behind' },
  { id: 'red', label: 'Stopped' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

const TONE: Record<BoardTone, { chip: string; dot: string }> = {
  green: { chip: 'bg-[#E5F6EF] text-[#0A6159]', dot: 'bg-[#0E857A]' },
  yellow: { chip: 'bg-[#FFF4D6] text-[#8A5A00]', dot: 'bg-[#C48A12]' },
  red: { chip: 'bg-[#FDECEC] text-[#9B2C2C]', dot: 'bg-[#C44747]' },
}

function sentOn(iso: string, timeZone: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone }).format(date)
  } catch {
    return agoLabel(iso)
  }
}

export function FollowThroughView({
  rows,
  nowIso,
  timeZone,
}: {
  rows: FollowRow[]
  nowIso: string
  timeZone: string
  counts?: unknown
}) {
  const now = new Date(nowIso)
  const router = useRouter()
  const counts = followCounts(rows, now, timeZone)
  const [filter, setFilter] = useState<FilterId>('all')
  const [note, setNote] = useState('')
  const [pending, start] = useTransition()
  const numbers: Record<FilterId, number> = {
    all: counts.all,
    green: counts.onTrack,
    yellow: counts.falling,
    red: counts.stopped,
  }
  const shown = sortFollowRows(rows, now, timeZone).filter((row) => {
    if (filter === 'all') return true
    return boardStatus(row, now, timeZone).tone === filter
  })

  return (
    <section className="mt-4 rounded-[22px] bg-white p-4">
      <h2 className="dp-ui text-[18px] font-extrabold text-[#15202B]">Who is on track</h2>
      <p className="mt-1 text-[14px] text-[#5b6773]">On track is green. Falling behind is yellow. Stopped is red. Nudge is there for yellow and red.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const on = filter === item.id
          return (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`dp-ui min-h-11 shrink-0 rounded-xl px-3 text-[13px] font-extrabold ${on ? 'bg-[#1E2D3B] text-white' : 'bg-[#F5F3EF] text-[#15202B]'}`}>
              {item.label} <span className={`ml-1 rounded-full px-1.5 text-[12px] ${on ? 'bg-white/20' : 'bg-white'}`}>{numbers[item.id]}</span>
            </button>
          )
        })}
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 text-[14px] text-[#5b6773]">No one here yet. <Link href="/doctor/people" className="font-extrabold text-[#0A6159] underline">Open People and send a home plan.</Link></p>
      ) : (
        <ul className="mt-2 divide-y divide-[#ECEAE5]">
          {shown.map((row) => {
            const status = boardStatus(row, now, timeZone)
            const tone = TONE[status.tone]
            const since = status.sinceExpected > 0
              ? `${status.sinceDone} of ${status.sinceExpected} since it was sent`
              : status.sinceDone > 0
                ? `${status.sinceDone} since it was sent`
                : 'Just sent'
            const week = status.weekExpected > 0
              ? `${status.weekDone} of ${status.weekExpected} this week`
              : status.weekDone > 0
                ? `${status.weekDone} this week`
                : '0 this week'
            const canNudge = status.tone !== 'green' && Boolean(row.assignmentId || row.remedyId)
            return (
              <li key={row.id} className="py-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="dp-ui truncate text-[16px] font-extrabold text-[#15202B]">{row.name}</p>
                      <span className={`dp-ui shrink-0 rounded-full px-2.5 py-1 text-[13px] font-extrabold ${tone.chip}`}>{status.label}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[14px] text-[#15202B]">{row.plan}</p>
                    <p className="mt-0.5 text-[13px] text-[#5b6773]">Sent {sentOn(row.recommendedAt, timeZone)} · {frequencyLabel(row.timesPerWeek || 3)}</p>
                    <p className="text-[14px] text-[#15202B]">{since} · {week}</p>
                  </div>
                </div>
                {canNudge ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => start(async () => {
                      const result = row.remedyId ? await nudgeRemedy(row.remedyId) : await nudgeHomePlan(row.assignmentId || '')
                      setNote(result.ok ? (result.message || 'Nudge sent.') : result.error)
                      if (result.ok) router.refresh()
                    })}
                    className="dp-ui ml-6 mt-2 inline-flex h-11 items-center rounded-xl bg-[#0E857A] px-4 text-[14px] font-extrabold text-white"
                  >
                    Nudge
                  </button>
                ) : status.tone !== 'green' && !row.assignmentId ? (
                  <p className="ml-6 mt-2 text-[13px] text-[#5b6773]">Invite sent</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
      {note ? <p className="mt-2 text-[14px] text-[#15202B]" role="status">{note}</p> : null}
    </section>
  )
}
