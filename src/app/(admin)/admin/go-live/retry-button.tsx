'use client'

import { useState, useTransition } from 'react'
import { retryGoLiveStep } from './actions'

export function RetryStepButton({ doctorId, step, welcome }: { doctorId: string; step: string; welcome?: boolean }) {
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')
  const [resendWelcome, setResendWelcome] = useState(false)
  return (
    <div className="flex flex-col items-start gap-1">
      {welcome ? (
        <label className="flex min-h-11 items-center gap-2 text-[13px] font-bold">
          <input type="checkbox" checked={resendWelcome} onChange={(event) => setResendWelcome(event.target.checked)} />
          Resend welcome
        </label>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          const result = await retryGoLiveStep(doctorId, step, welcome ? resendWelcome : false)
          setNote(result.reason)
        })}
        className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#15202B] px-3 text-[13px] font-extrabold text-white disabled:opacity-60"
      >
        {pending ? 'Retrying' : 'Retry with force'}
      </button>
      {note ? <p className="max-w-xs text-[12px] text-[#5b6773]">{note}</p> : null}
    </div>
  )
}
