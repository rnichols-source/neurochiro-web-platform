'use client'

import { useState, useTransition } from 'react'
import { AREAS } from '@/components/community/areas'
import { AreaBand, StepHeading } from '@/components/community/chrome'
import { MessageIcon } from '@/components/community/icons'
import { RemindButton } from '@/components/community/remind-button'
import { ShowCountdown } from '@/components/community/show-countdown'
import { WeekCheckIn } from '@/components/community/week-check-in'
import { askLiveQuestion } from '@/lib/community/phase-actions'
import type { Feeling } from '@/lib/community/phases'

const week = AREAS.week

export function WeekView({
  feeling,
  ready,
  whenLabel,
  countdown,
  reminder,
}: {
  feeling: Feeling | null
  ready: boolean
  whenLabel: string
  countdown: { days: number; hours: number; minutes: number }
  reminder: { assignmentId: string | null; enabled: boolean }
}) {
  return (
    <div>
      <AreaBand area="week" title="This Week" subtitle="Check in, then join the live Q&A." />
      <section className="mt-4">
        <StepHeading n={1} color={week.color}>Weekly check-in</StepHeading>
        <div className="rounded-[22px] bg-white p-[18px]">
          <p className="nc-ui block text-[17px] font-extrabold leading-snug tracking-[-0.02em] text-[#15202B]">How is your family’s nervous system this week?</p>
          <div className="mt-3.5">
            {ready ? <WeekCheckIn initial={feeling} /> : <p className="text-[14px] text-[#3d4a57]">The check-in saves with the latest database update.</p>}
          </div>
        </div>
      </section>
      <section>
        <StepHeading n={2} color={week.color}>Live with Dr. Ray</StepHeading>
        <div className="rounded-3xl bg-gradient-to-br from-[#2B1D3A] to-[#5C3473] p-[18px] text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="nc-ui inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#B4501A] px-2.5 text-[12px] font-extrabold tracking-[0.06em] text-white">LIVE Q&A</span>
            <span className="nc-ui text-[13px] font-bold text-white/95">{whenLabel}</span>
          </div>
          <h3 className="nc-ui my-3 text-[22px] font-extrabold text-white">The Weekly Adjustment</h3>
          <ShowCountdown initial={countdown} />
          <RemindButton assignmentId={reminder.assignmentId} enabled={reminder.enabled} />
          <AskQuestion />
        </div>
      </section>
    </div>
  )
}

function AskQuestion() {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="nc-ui flex min-h-11 w-full items-center justify-center gap-1.5 text-[14px] font-bold text-white">
        <MessageIcon />
        Ask a question ahead of time
      </button>
      {open ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            setSaved(false)
            start(async () => {
              const result = await askLiveQuestion(body)
              if (!result.ok) {
                setError(result.error)
                return
              }
              setError(null)
              setSaved(true)
            })
          }}
        >
          <label className="sr-only" htmlFor="live-question">Question for the show</label>
          <textarea
            id="live-question"
            rows={3}
            maxLength={280}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="A question for the show"
            className="w-full rounded-[14px] border-2 border-white/30 bg-white px-3 py-2 text-[15px] text-[#15202B] outline-none"
          />
          <p className="text-[12.5px] leading-snug text-white/85">Your name is not shown with it. A question is not a visit, and NeuroChiro is not your doctor.</p>
          {error ? <p className="text-[13px] text-white" role="alert">{error}</p> : null}
          <button type="submit" disabled={pending} className="nc-ui min-h-11 rounded-[14px] bg-white px-4 text-[14px] font-extrabold text-[#5C3473] disabled:opacity-60">
            {pending ? 'Saving…' : 'Send for the show'}
          </button>
          {saved ? <p className="text-[13px] text-white">Saved for the next Weekly Adjustment.</p> : null}
        </form>
      ) : null}
    </div>
  )
}
