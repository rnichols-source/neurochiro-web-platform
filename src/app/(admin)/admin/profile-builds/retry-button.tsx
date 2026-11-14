'use client'

import { useTransition } from 'react'
import { requeueProfileBuild } from './actions'

export function RetryBuildButton({ jobId }: { jobId: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => { void requeueProfileBuild(jobId) })}
      className="fd-ui inline-flex min-h-11 items-center rounded-xl bg-[#15202B] px-3 text-[13px] font-extrabold text-white disabled:opacity-60"
    >
      {pending ? 'Queued' : 'Try again'}
    </button>
  )
}
