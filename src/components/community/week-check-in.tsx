'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveCheckIn } from '@/lib/community/phase-actions'
import { FEELING_LABELS, type Feeling } from '@/lib/community/phases'

const ORDER: Feeling[] = ['doing_well', 'a_little_off', 'want_to_talk']

export function WeekCheckIn({ initial }: { initial: Feeling | null }) {
  const router = useRouter()
  const [current, setCurrent] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ORDER.map((feeling) => {
          const on = current === feeling
          const resting = feeling === 'doing_well' ? 'bg-[#e7f6ee] text-[#1f8a4c]' : 'bg-[#f3f0ea] text-neuro-navy'
          return (
            <button
              key={feeling}
              type="button"
              disabled={pending}
              onClick={() => start(async () => {
                const result = await saveCheckIn(feeling)
                if (!result.ok) {
                  setError(result.error)
                  return
                }
                setError(null)
                setCurrent(feeling)
                router.refresh()
              })}
              className={`min-h-11 rounded-full px-3 text-[13px] font-semibold disabled:opacity-60 ${on ? 'bg-[#1f8a4c] text-white' : resting}`}
            >
              {FEELING_LABELS[feeling]}
            </button>
          )
        })}
      </div>
      {error ? <p className="mt-2 text-[12.5px] text-[#B4501A]" role="alert">{error}</p> : null}
      {current === 'want_to_talk' ? (
        <p className="mt-2 text-[12.5px] leading-snug text-[#3d4a57]">This stays on your account. It is not sent to a doctor. A visit request is how you ask the office to reach out.</p>
      ) : null}
    </div>
  )
}
