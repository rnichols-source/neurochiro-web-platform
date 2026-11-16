'use client'

import { useState, useTransition } from 'react'
import { rebuildProfile, requeueProfileBuild } from './actions'

export function RetryBuildButton({ jobId, doctorId }: { jobId: string; doctorId: string }) {
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          const result = await rebuildProfile(doctorId)
          setNote(result.reason)
        })}
        className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-3 text-[13px] font-extrabold text-white disabled:opacity-60"
      >
        {pending ? 'Rebuilding' : 'Rebuild profile'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => { void requeueProfileBuild(jobId) })}
        className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#15202B] px-3 text-[13px] font-extrabold text-white disabled:opacity-60"
      >
        Queue again
      </button>
      {note ? <p className="max-w-xs text-right text-[12px] text-[#5b6773]">{note}</p> : null}
    </div>
  )
}
