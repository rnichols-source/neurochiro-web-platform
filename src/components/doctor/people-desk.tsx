'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setRequestStage } from '@/lib/doctor/pipeline-actions'
import { isClosedStage, nextStage, stageLabel } from '@/lib/doctor/pipeline'
import { followLabelForPerson, type FollowRow } from '@/lib/doctor/follow-through'
import { doctorClock } from '@/lib/doctor/places'
import type { PersonCard } from '@/lib/doctor/portal-data'
import { EmptyNote } from '@/components/doctor/chrome'
import { RecommendPlan } from '@/components/doctor/recommend-plan'

const STAGES = [
  { id: 'requested', label: 'Requested' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'started_care', label: 'Started care' },
  { id: 'closed', label: 'Closed' },
  { id: 'other', label: 'Other' },
] as const

type StageId = (typeof STAGES)[number]['id']

const CLOSE_REASONS = [
  { id: 'not_a_fit', label: 'Not a fit' },
  { id: 'no_answer', label: 'No answer' },
  { id: 'went_elsewhere', label: 'Went elsewhere' },
] as const

function pipelineRow(row: PersonCard) {
  return row.kind === 'visit' || row.kind === 'request'
}

function inStage(row: PersonCard, stage: StageId) {
  if (stage === 'other') return !pipelineRow(row)
  if (!pipelineRow(row)) return false
  if (stage === 'closed') return isClosedStage(row.stage || row.status)
  return (row.stage || row.status) === stage
}

function stageTab(row: PersonCard): StageId {
  if (!pipelineRow(row)) return 'other'
  const stage = row.stage || row.status
  if (isClosedStage(stage)) return 'closed'
  return STAGES.some((item) => item.id === stage) ? stage as StageId : 'requested'
}

function dial(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned || phone
}

function rowLabel(row: PersonCard) {
  if (pipelineRow(row)) return stageLabel(row.stage || row.status)
  const labels: Record<string, string> = {
    active: 'Home plan sent',
    home: 'In your people',
    sent: 'Sent',
    pending: 'Sent',
    viewed: 'Seen',
    accepted: 'Accepted',
    declined: 'Declined',
  }
  return labels[row.status] || row.status.replace(/_/g, ' ')
}

export function PeopleDesk({
  people,
  ready,
  timeZone,
  plans,
  customSets,
  remedies = [],
  followRows = [],
  nowIso,
  openCard = false,
  plansOpen = false,
  canSendPlans = true,
  openId = '',
}: {
  people: PersonCard[]
  ready: boolean
  timeZone: string
  plans: { slug: string; name: string; timesPerWeek?: number }[]
  customSets: { id: string; title: string }[]
  remedies?: { key: string; name: string; section: string }[]
  followRows?: FollowRow[]
  nowIso?: string
  openCard?: boolean
  plansOpen?: boolean
  canSendPlans?: boolean
  openId?: string
}) {
  const counts = useMemo(() => {
    const map = new Map<StageId, number>()
    for (const stage of STAGES) map.set(stage.id, people.filter((row) => inStage(row, stage.id)).length)
    return map
  }, [people])
  const opened = people.find((row) => row.id === openId || row.sourceId === openId) || null
  const firstStage = opened ? stageTab(opened) : (STAGES.find((stage) => (counts.get(stage.id) || 0) > 0)?.id || 'requested')
  const [filter, setFilter] = useState<StageId>(firstStage)
  const rows = people.filter((row) => inStage(row, filter))
  const [selectedId, setSelectedId] = useState(opened?.id || rows[0]?.id || '')
  const [mobileCard, setMobileCard] = useState(Boolean(opened) || openCard)
  const selected = people.find((row) => row.id === selectedId) || rows[0] || null
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')
  const router = useRouter()
  const now = new Date(nowIso || Date.now())
  const followLabel = selected ? followLabelForPerson(selected, followRows, now, timeZone) : null

  function pick(id: string) {
    setSelectedId(id)
    setMobileCard(true)
  }

  function move(stage: string) {
    if (!selected?.source || !selected.sourceId) return
    setNote('')
    start(async () => {
      const result = await setRequestStage(selected.source || '', selected.sourceId || '', stage)
      setNote(result.ok ? (result.message || 'Saved.') : `${result.error} Try again.`)
      if (result.ok) {
        if (isClosedStage(stage)) setFilter('closed')
        else if (STAGES.some((item) => item.id === stage)) setFilter(stage as StageId)
        router.refresh()
      }
    })
  }

  const upcoming = selected ? nextStage(selected.stage || selected.status) : null

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[420px_1fr]">
      <div className={mobileCard ? 'max-lg:hidden' : ''}>
        <div className="flex flex-wrap gap-1 rounded-2xl bg-white p-1">
          {STAGES.map((item) => {
            const on = filter === item.id
            return (
              <button key={item.id} type="button" onClick={() => { setFilter(item.id); const next = people.filter((row) => inStage(row, item.id)); setSelectedId(next[0]?.id || '') }} className={`dp-ui min-h-11 shrink-0 rounded-xl px-3 text-[13px] font-extrabold ${on ? 'bg-[#2C6BB4] text-white' : 'text-[#5b6773]'}`}>
                {item.label} <span className={`ml-1 rounded-full px-1.5 text-[12px] ${on ? 'bg-white/25' : 'bg-[#ECEAE5]'}`}>{counts.get(item.id) || 0}</span>
              </button>
            )
          })}
        </div>
        {!ready ? <p className="mt-3 text-[14px] text-[#5b6773]">Some lists are still catching up. Everyone already here is shown.</p> : null}
        {rows.length === 0 ? (
          <div className="mt-3">
            <EmptyNote
              title={people.filter(pipelineRow).length === 0 ? 'No requests yet' : 'No one in this step'}
              sentence={people.filter(pipelineRow).length === 0
                ? 'When someone asks to see you from your public page, they show up here. Open the name, call them, then move the stage.'
                : 'New requests show up under Requested. Referrals and messages are under Other.'}
              actionHref={people.filter(pipelineRow).length === 0 ? '/doctor/profile' : '/doctor'}
              action={people.filter(pipelineRow).length === 0 ? 'Finish your profile' : 'Back to Today'}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {rows.map((row) => {
              const on = selected?.id === row.id
              return (
                <li key={row.id}>
                  <button type="button" onClick={() => pick(row.id)} className={`flex w-full items-center gap-3 rounded-[18px] bg-white px-3 py-3 text-left ${on ? 'outline outline-2 outline-[#2C6BB4]' : ''}`}>
                    <span className="min-w-0 flex-1">
                      <span className="dp-ui block truncate text-[16px] font-extrabold text-[#15202B]">{row.name}</span>
                      <span className="block truncate text-[13px] text-[#5b6773]">{row.detail}</span>
                    </span>
                    <span className="dp-ui shrink-0 rounded-full bg-[#F5F3EF] px-2 py-1 text-[12px] font-extrabold text-[#3d4a57]">{rowLabel(row)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className={mobileCard ? '' : 'max-lg:hidden'}>
        {mobileCard ? (
          <button type="button" onClick={() => setMobileCard(false)} className="dp-ui mb-3 inline-flex min-h-11 items-center text-[15px] font-extrabold text-[#1F4F8C] lg:hidden">Back to the list</button>
        ) : null}
        {selected ? (
          <article className="rounded-[26px] bg-white p-6 shadow-[0_14px_30px_-18px_rgba(21,32,43,0.3)]">
            <p className="dp-ui text-[12px] font-extrabold text-[#2C6BB4]">{pipelineRow(selected) ? 'Request' : selected.kind.replace('_', ' ')}</p>
            <h2 className="dp-ui mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-[#15202B]">{selected.name}</h2>
            <p className="mt-2 text-[15px] font-bold text-[#15202B]">{rowLabel(selected)}</p>
            {followLabel ? <p className="mt-1 text-[14px] text-[#0A6159]">Follow-through: {followLabel}. <Link href="/doctor/care-sets" className="font-extrabold underline">Open the board</Link></p> : null}
            {pipelineRow(selected) ? (
              <div className="mt-4 space-y-2 text-[15px] text-[#15202B]">
                <p>{selected.phone ? selected.phone : 'No phone was shared.'}</p>
                <p>{selected.email ? selected.email : 'No email was shared.'}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selected.phone ? <a href={`tel:${dial(selected.phone)}`} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#2C6BB4] px-5 text-[15px] font-extrabold text-white">Call</a> : null}
                  {selected.phone ? <a href={`sms:${dial(selected.phone)}`} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#E2ECF8] px-5 text-[15px] font-extrabold text-[#1F4F8C]">Text</a> : null}
                  {selected.email ? <a href={`mailto:${selected.email}`} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#E2ECF8] px-5 text-[15px] font-extrabold text-[#1F4F8C]">Email</a> : null}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[14px] text-[#5b6773]">{selected.detail}</p>
            )}
            {selected.message ? <p className="mt-4 rounded-2xl bg-[#F5F3EF] px-4 py-3 text-[15px] text-[#3d4a57]">{selected.message}</p> : null}
            {selected.history?.length ? (
              <div className="mt-4">
                <p className="dp-ui text-[13px] font-extrabold text-[#15202B]">Stage history</p>
                <ul className="mt-2 space-y-1">
                  {selected.history.map((item) => (
                    <li key={`${item.stage}-${item.at}`} className="text-[13px] text-[#5b6773]">{stageLabel(item.stage)} · {doctorClock(item.at, timeZone)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.profileId && selected.canMessage ? (
                <Link prefetch href={`/doctor/messages?to=${selected.profileId}`} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#2C6BB4] px-5 text-[15px] font-extrabold text-white">Message</Link>
              ) : null}
              {selected.href ? (
                <Link prefetch href={selected.href} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#E2ECF8] px-5 text-[15px] font-extrabold text-[#1F4F8C]">Open</Link>
              ) : null}
              {upcoming && selected.source ? (
                <button type="button" disabled={pending} onClick={() => move(upcoming)} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#1E2D3B] px-5 text-[15px] font-extrabold text-white">
                  {pending ? 'Saving…' : `Move to ${stageLabel(upcoming)}`}
                </button>
              ) : null}
              {pipelineRow(selected) && selected.source && (selected.stage === 'requested' || selected.stage === 'contacted' || selected.status === 'requested') ? (
                <button type="button" disabled={pending} onClick={() => move('scheduled')} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#2C6BB4] px-5 text-[15px] font-extrabold text-white">
                  {pending ? 'Saving…' : 'Mark scheduled'}
                </button>
              ) : null}
              {pipelineRow(selected) && selected.source && !isClosedStage(selected.stage) ? CLOSE_REASONS.map((reason) => (
                <button key={reason.id} type="button" disabled={pending} onClick={() => move(reason.id)} className="dp-ui inline-flex h-11 items-center rounded-xl border border-[#D7DEE6] bg-white px-3 text-[14px] font-extrabold text-[#3d4a57]">
                  {reason.label}
                </button>
              )) : null}
            </div>
            {canSendPlans && pipelineRow(selected) && selected.source && selected.sourceId ? (
              <RecommendPlan
                source={selected.source}
                sourceId={selected.sourceId}
                plans={plans}
                customSets={customSets}
                remedies={remedies}
                highlight={selected.stage === 'started_care'}
                startOpen={plansOpen}
              />
            ) : null}
            {note ? <p className="mt-3 text-[14px] text-[#15202B]">{note}</p> : null}
          </article>
        ) : (
          <EmptyNote title="Pick a person" sentence="Phone, email, the request, and the stage history open here." actionHref="/doctor/help" action="How requests work" />
        )}
      </div>
    </div>
  )
}
