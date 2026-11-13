'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setExercisePassportShare, setExerciseReminder } from '@/lib/community/phase-actions'
import { toggleLibraryExercise } from '@/lib/community/library-actions'
import {
  LIBRARY_COPY,
  assignedByLine,
  countDone,
  phaseProgressLabel,
  planExerciseKeys,
  type LibraryPlan,
} from '@/lib/community/library-model'
import { FormError } from '@/components/community/ui'

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
      {assignments.map((assignment) => {
        const done = new Set(assignment.doneKeys)
        const overall = countDone(planExerciseKeys(assignment.library), done)
        return (
          <article key={assignment.id} className="rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-[15px] py-[14px]">
            <p className="text-[12.5px] font-semibold text-[#6b7785]">{LIBRARY_COPY.origin}</p>
            <h2 className="mt-1 font-heading text-[18px] font-bold text-neuro-navy">{assignment.title}</h2>
            <p className="mt-1 text-[13px] text-[#3d4a57]">{assignedByLine(assignment.doctorName)}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-[#6b7785]">{LIBRARY_COPY.questions}</p>
            <p className="mt-2 text-[13px] text-neuro-navy">{phaseProgressLabel(overall.finished, overall.total)}</p>
            {assignment.library.objective ? <p className="mt-2 text-[13.5px] leading-snug text-[#3d4a57]">{assignment.library.objective}</p> : null}
            {assignment.note ? (
              <p className="mt-3 rounded-2xl bg-[#F5F3EF] px-3 py-2 text-[13px] leading-snug text-[#16202a]">
                <span className="font-semibold">{LIBRARY_COPY.doctorNoteHeading}. </span>
                {assignment.note}
              </p>
            ) : null}
            {assignment.library.phases.map((phase) => {
              const progress = countDone(phase.exercises.map((exercise) => exercise.key), done)
              return (
                <section key={phase.key} className="mt-4 border-t border-[rgba(30,45,59,0.08)] pt-3">
                  <h3 className="font-heading text-[16px] font-bold text-neuro-navy">{phase.name}</h3>
                  <p className="mt-1 text-[12.5px] text-[#6b7785]">{phase.week} · {phaseProgressLabel(progress.finished, progress.total)}</p>
                  {phase.goal ? <p className="mt-1 text-[13px] leading-snug text-[#3d4a57]">{phase.goal}</p> : null}
                  {phase.frequency ? <p className="mt-1 text-[13px] text-[#3d4a57]">{phase.frequency}</p> : null}
                  {phase.focus ? <p className="mt-1 text-[13px] text-[#3d4a57]">{phase.focus}</p> : null}
                  <ul className="mt-3 space-y-3">
                    {phase.exercises.map((exercise) => (
                      <li key={exercise.key}>
                        <label className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={done.has(exercise.key)}
                            disabled={pending}
                            onChange={(event) => {
                              const checked = event.target.checked
                              run(() => toggleLibraryExercise(assignment.id, exercise.key, checked))
                            }}
                          />
                          <span>
                            <span className="block text-[14px] font-semibold text-neuro-navy">{exercise.name}</span>
                            {exercise.rx ? <span className="block text-[13px] text-[#B4501A]">{exercise.rx}</span> : null}
                            <span className="mt-1 block text-[13px] leading-snug text-[#3d4a57]">{exercise.description}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
            {assignment.library.lifestyle.length > 0 ? (
              <section className="mt-4 border-t border-[rgba(30,45,59,0.08)] pt-3">
                <h3 className="font-heading text-[15px] font-bold text-neuro-navy">{LIBRARY_COPY.lifestyleHeading}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-snug text-[#3d4a57]">
                  {assignment.library.lifestyle.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            ) : null}
            {assignment.library.maintenance ? (
              <section className="mt-4 border-t border-[rgba(30,45,59,0.08)] pt-3">
                <h3 className="font-heading text-[15px] font-bold text-neuro-navy">{LIBRARY_COPY.maintenanceHeading}</h3>
                <p className="mt-1 text-[13px] leading-snug text-[#3d4a57]">{assignment.library.maintenance}</p>
              </section>
            ) : null}
            <div className="mt-4 space-y-2">
              <label className="flex items-start gap-2 text-[13px] text-[#3d4a57]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={assignment.reminder}
                  disabled={pending}
                  onChange={(event) => {
                    const checked = event.target.checked
                    run(() => setExerciseReminder(assignment.id, checked))
                  }}
                />
                <span>{LIBRARY_COPY.reminder}</span>
              </label>
              <label className="flex items-start gap-2 text-[13px] text-[#3d4a57]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={assignment.shareOnPassport}
                  disabled={pending}
                  onChange={(event) => {
                    const checked = event.target.checked
                    run(() => setExercisePassportShare(assignment.id, checked))
                  }}
                />
                <span>{LIBRARY_COPY.passport}</span>
              </label>
            </div>
            <p className="mt-2 text-[12.5px] text-[#6b7785]">{assignment.status === 'done' ? 'Marked done' : 'In progress'}</p>
          </article>
        )
      })}
    </div>
  )
}
