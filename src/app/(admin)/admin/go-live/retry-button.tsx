'use client'

import { useState, useTransition } from 'react'
import { retryGoLiveStep } from './actions'

export function RetryStepButton({ doctorId, step }: { doctorId: string; step: string }) {
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          const result = await retryGoLiveStep(doctorId, step)
          setNote(result.reason)
        })}
        className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#15202B] px-3 text-[13px] font-extrabold text-white disabled:opacity-60"
      >
        {pending ? 'Retrying' : 'Retry step'}
      </button>
      {note ? <p className="max-w-xs text-[12px] text-[#5b6773]">{note}</p> : null}
    </div>
  )
}
