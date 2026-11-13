'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BellIcon } from '@/components/community/icons'
import { setExerciseReminder } from '@/lib/community/phase-actions'

export function RemindButton({ assignmentId, enabled }: { assignmentId: string | null; enabled: boolean }) {
  const router = useRouter()
  const [on, setOn] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!assignmentId) {
    return (
      <p className="nc-ui mt-3 flex min-h-11 items-center justify-center gap-2 text-center text-[14px] font-bold text-white/95">
        A reminder shows on This Week when your doctor assigns a plan.
      </p>
    )
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={pending}
        aria-pressed={on}
        onClick={() => start(async () => {
          const next = !on
          const result = await setExerciseReminder(assignmentId, next)
          if (!result.ok) {
            setError(result.error)
            return
          }
          setError(null)
          setOn(next)
          router.refresh()
        })}
        className="nc-ui flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white text-[16px] font-extrabold text-[#5C3473] disabled:opacity-60"
      >
        <BellIcon />
        {on ? 'Reminder on' : 'Remind me'}
      </button>
      {error ? <p className="mt-2 text-center text-[13px] text-white" role="alert">{error}</p> : null}
      <p className="mt-2 text-center text-[12px] leading-snug text-white/85">In the app only. No extra emails.</p>
    </div>
  )
}
