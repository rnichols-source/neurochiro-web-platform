'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  setExercisePassportShare,
  setExerciseReminder,
  toggleExerciseStep,
  trySampleSet,
} from '@/lib/community/phase-actions'
import { FormError } from '@/components/community/ui'

type ExerciseCard = {
  id: string
  title: string
  note: string | null
  sample: boolean
  reminder: boolean
  shareOnPassport: boolean
  status: 'active' | 'done'
  steps: { id: string; position: number; label: string; done: boolean }[]
}

export function ExerciseBoard({ assignments, sampleReady }: { assignments: ExerciseCard[]; sampleReady: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const hasSample = assignments.some((assignment) => assignment.sample && assignment.status === 'active')

  function run(task: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null)
    start(async () => {
      const result = await task()
      if (!result.ok) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <FormError message={error} />
      {assignments.map((assignment) => (
        <article key={assignment.id} className="rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-[15px] py-[14px]">
          <p className="text-[11.5px] font-semibold text-[#6b7785]">{assignment.sample ? 'Sample · not care' : 'From your home doctor'}</p>
          <h2 className="mt-1 font-heading text-[16px] font-bold text-neuro-navy">{assignment.title}</h2>
          {assignment.note ? <p className="mt-1 text-[13px] leading-snug text-[#3d4a57]">{assignment.note}</p> : null}
          <p className="mt-1 text-[12.5px] text-[#6b7785]">{assignment.status === 'done' ? 'Marked done' : 'In progress'}</p>
          <ul className="mt-3 space-y-2">
            {assignment.steps.map((step) => (
              <li key={step.id}>
                <label className="flex items-start gap-2 text-[13.5px] text-neuro-navy">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={step.done}
                    disabled={pending}
                    onChange={(event) => run(() => toggleExerciseStep(assignment.id, step.id, event.target.checked))}
                  />
                  <span>{step.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2 text-[13px] text-[#3d4a57]">
              <input
                type="checkbox"
                className="mt-1"
                checked={assignment.reminder}
                disabled={pending}
                onChange={(event) => run(() => setExerciseReminder(assignment.id, event.target.checked))}
              />
              <span>A gentle reminder on This week. No extra emails.</span>
            </label>
            <label className="flex items-start gap-2 text-[13px] text-[#3d4a57]">
              <input
                type="checkbox"
                className="mt-1"
                checked={assignment.shareOnPassport}
                disabled={pending}
                onChange={(event) => run(() => setExercisePassportShare(assignment.id, event.target.checked))}
              />
              <span>Let a passport introduction include this title, only when you send one.</span>
            </label>
          </div>
        </article>
      ))}
      {!hasSample ? (
        <div className="rounded-2xl bg-[#fdf1ea] px-3.5 py-3">
          <p className="font-heading text-[13px] font-bold text-neuro-navy">Sample · not care</p>
          <p className="mt-1 text-[12.5px] leading-snug text-[#3d4a57]">This preview shows how a set looks. It is not a stretch, a remedy, or advice. Your doctor writes the real steps.</p>
          <button
            type="button"
            disabled={pending || !sampleReady}
            onClick={() => run(() => trySampleSet())}
            className="mt-2 min-h-11 rounded-[11px] bg-neuro-navy px-3 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {sampleReady ? 'Try the sample set' : 'Sample set saves with the database update'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
