'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AREAS } from '@/components/community/areas'
import { bleed } from '@/components/community/chrome'
import { BackIcon, CheckIcon, ChevronIcon } from '@/components/community/icons'
import { FormError } from '@/components/community/ui'
import { markLibraryPhaseDone, toggleLibraryExercise } from '@/lib/community/library-actions'
import {
  LIBRARY_COPY,
  assignedByLine,
  countDone,
  type LibraryPlan,
} from '@/lib/community/library-model'
import { setExercisePassportShare, setExerciseReminder } from '@/lib/community/phase-actions'
import { firstOpenPhase, splitPhaseName } from '@/lib/community/today'

const care = AREAS.care

type LibraryAssignment = {
  id: string
  title: string
  note: string | null
  doctorName: string | null
  reminder: boolean
  shareOnPassport: boolean
  status: 'active' | 'done'
  library: LibraryPlan
  doneKeys: string[]
}

export function LibraryPlanBoard({ assignments }: { assignments: LibraryAssignment[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [planId, setPlanId] = useState(assignments[0]?.id || '')
  const assignment = assignments.find((item) => item.id === planId) || assignments[0]
  const done = useMemo(() => new Set(assignment?.doneKeys || []), [assignment])
  const phases = assignment?.library.phases || []
  const phaseStats = phases.map((phase) => {
    const progress = countDone(phase.exercises.map((exercise) => exercise.key), done)
    return { done: progress.finished, total: progress.total }
  })
  const phaseIndex = firstOpenPhase(phaseStats)
  const [pickedPhase, setPickedPhase] = useState<number | null>(null)
  const activeIndex = pickedPhase ?? phaseIndex
  const phase = phases[activeIndex]
  const openDefault = phase?.exercises.find((exercise) => !done.has(exercise.key))?.key || phase?.exercises[0]?.key || ''
  const [openKey, setOpenKey] = useState(openDefault)

  function run(task: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null)
    start(async () => {
      const result = await task()
      if (!result.ok) setError(result.error)
      else router.refresh()
    })
  }

  if (!assignment || !phase) {
    return (
      <div>
        <PlanHeader title="My exercise plan" crumb="Care › My exercise plan" />
        <p className="mt-4 text-[14px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.nothingAssigned}</p>
      </div>
    )
  }

  const parts = splitPhaseName(phase.name)
  const showing = openKey && phase.exercises.some((exercise) => exercise.key === openKey) ? openKey : openDefault

  return (
    <div>
      <PlanHeader title={assignment.title} crumb="Care › My exercise plan">
        {assignments.length > 1 ? (
          <div className="mt-3 flex gap-1.5 overflow-x-auto">
            {assignments.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setPlanId(item.id); setPickedPhase(null) }}
                className={`nc-ui min-h-11 shrink-0 rounded-full px-3 text-[13px] font-extrabold ${item.id === assignment.id ? 'bg-white text-[#0A6159]' : 'bg-white/15 text-white'}`}
              >
                {item.title}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-3.5 flex gap-1 rounded-[14px] bg-black/20 p-1" role="tablist" aria-label="Phases">
          {phases.map((item, index) => {
            const on = index === activeIndex
            const chip = splitPhaseName(item.name)
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPickedPhase(index)}
                className={`nc-ui min-h-11 flex-1 rounded-[11px] px-1 py-1.5 text-center text-[13px] font-extrabold ${on ? 'bg-white text-[#0A6159]' : 'text-white/90'}`}
              >
                {chip.short}
                <small className="mt-0.5 block text-[12px] font-semibold">{item.week}</small>
              </button>
            )
          })}
        </div>
      </PlanHeader>

      <div className="mt-3.5 grid grid-cols-[1.4fr_1fr] gap-2.5">
        <div className="rounded-[14px] bg-white px-3 py-2.5">
          <small className="nc-ui block text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#0A6159]">Goal</small>
          <b className="nc-ui mt-1 block text-[13px] font-extrabold leading-snug text-[#15202B]">{phase.goal || assignment.library.objective}</b>
        </div>
        <div className="rounded-[14px] bg-white px-3 py-2.5">
          <small className="nc-ui block text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#0A6159]">How often</small>
          <b className="nc-ui mt-1 block text-[13px] font-extrabold leading-snug text-[#15202B]">{phase.frequency || 'As your doctor set it'}</b>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-[#5b6773]">{assignedByLine(assignment.doctorName)} · {parts.rest || phase.name}</p>
      {assignment.note ? (
        <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-[13px] leading-snug text-[#15202B]">
          <span className="font-semibold">{LIBRARY_COPY.doctorNoteHeading}. </span>
          {assignment.note}
        </p>
      ) : null}
      <FormError message={error} />
      <ul className="mt-3 flex flex-col gap-2 pb-4">
        {phase.exercises.map((exercise, index) => {
          const finished = done.has(exercise.key)
          const open = exercise.key === showing
          return (
            <li key={exercise.key} className={`rounded-2xl bg-white ${open ? 'outline outline-2 outline-[#0E857A]' : ''}`}>
              <div className="flex items-start gap-3 px-3 py-2.5">
                <button
                  type="button"
                  disabled={pending}
                  aria-pressed={finished}
                  aria-label={finished ? `Mark ${exercise.name} not done` : `Mark ${exercise.name} done`}
                  onClick={() => run(() => toggleLibraryExercise(assignment.id, exercise.key, !finished))}
                  className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 ${finished ? 'border-[#0E857A] bg-[#0E857A] text-white' : 'border-[#CFE7E3] text-[#0E857A]'}`}
                >
                  {finished ? <CheckIcon /> : <span className="nc-ui text-[14px] font-extrabold">{index + 1}</span>}
                </button>
                <button type="button" onClick={() => setOpenKey(exercise.key)} className="min-h-11 flex-1 py-1 text-left">
                  <span className={`nc-ui block text-[14.5px] font-extrabold leading-tight ${finished ? 'text-[#6b7785] line-through decoration-[#a5b0ba]' : 'text-[#15202B]'}`}>{exercise.name}</span>
                  {exercise.rx ? <span className="mt-0.5 block text-[12.5px] text-[#5b6773]">{exercise.rx}</span> : null}
                  {open && exercise.description ? <span className="mt-1.5 block text-[13px] leading-snug text-[#3d4a57]">{exercise.description}</span> : null}
                </button>
                <ChevronIcon size={18} className="mt-3 shrink-0 text-[#0E857A]" />
              </div>
            </li>
          )
        })}
      </ul>
      <details className="mt-4 rounded-2xl bg-white px-3.5 py-2">
        <summary className="nc-ui flex min-h-11 cursor-pointer items-center text-[15px] font-extrabold text-[#15202B]">More about this plan</summary>
        <div className="space-y-3 pb-3 text-[13px] leading-snug text-[#3d4a57]">
          {phase.focus ? <p>{phase.focus}</p> : null}
          {assignment.library.lifestyle.length > 0 ? (
            <section>
              <h3 className="nc-ui text-[15px] font-extrabold text-[#15202B]">{LIBRARY_COPY.lifestyleHeading}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {assignment.library.lifestyle.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ) : null}
          {assignment.library.maintenance ? (
            <section>
              <h3 className="nc-ui text-[15px] font-extrabold text-[#15202B]">{LIBRARY_COPY.maintenanceHeading}</h3>
              <p className="mt-1">{assignment.library.maintenance}</p>
            </section>
          ) : null}
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={assignment.reminder}
              disabled={pending}
              onChange={(event) => run(() => setExerciseReminder(assignment.id, event.target.checked))}
            />
            <span>{LIBRARY_COPY.reminder}</span>
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={assignment.shareOnPassport}
              disabled={pending}
              onChange={(event) => run(() => setExercisePassportShare(assignment.id, event.target.checked))}
            />
            <span>{LIBRARY_COPY.passport}</span>
          </label>
        </div>
      </details>
      <div className="sticky bottom-24 z-10 -mx-[18px] bg-gradient-to-t from-[#F5F3EF] from-40% to-transparent px-[18px] pb-3 pt-6 lg:bottom-4 lg:mx-0 lg:px-0">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markLibraryPhaseDone(assignment.id, phase.key))}
          className="nc-ui flex h-[58px] w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-extrabold text-white shadow-[0_10px_20px_-10px_rgba(21,32,43,0.4)] disabled:opacity-60"
          style={{ background: care.color }}
        >
          <CheckIcon size={20} />
          Mark today done
        </button>
      </div>
    </div>
  )
}

function PlanHeader({ title, crumb, children }: { title: string; crumb: string; children?: React.ReactNode }) {
  return (
    <header
      className={`nc-band ${bleed} rounded-b-[26px] px-5 pb-[18px] pt-3 text-white lg:rounded-none lg:px-10 lg:pb-7 lg:pt-6`}
      style={{ ['--c' as string]: care.color, ['--d' as string]: care.dark }}
    >
      <Link prefetch href="/portal/care" className="nc-ui inline-flex min-h-11 items-center gap-0.5 rounded-full bg-white/20 py-1.5 pl-2 pr-3.5 text-[15px] font-extrabold text-white">
        <BackIcon />
        Care
      </Link>
      <p className="mt-3 text-[12px] font-bold text-white/90">{crumb}</p>
      <h1 className="nc-ui mt-1 text-[23px] font-extrabold leading-[1.15] tracking-[-0.025em] text-white">{title}</h1>
      {children}
    </header>
  )
}
