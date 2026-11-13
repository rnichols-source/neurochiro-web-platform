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
      <div className="flex gap-2">
        {ORDER.map((feeling) => {
          const on = current === feeling
          return (
            <button
              key={feeling}
              type="button"
              disabled={pending}
              aria-pressed={on}
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
              className={`nc-ui min-h-[54px] flex-1 rounded-[14px] border-2 px-1 text-center text-[13.5px] font-extrabold leading-tight disabled:opacity-60 ${on ? 'border-[#7A4A94] bg-[#7A4A94] text-white' : 'border-[#E3D6EB] bg-white text-[#5C3473]'}`}
            >
              {FEELING_LABELS[feeling]}
            </button>
          )
        })}
      </div>
      {error ? <p className="mt-2 text-[13px] text-[#B4501A]" role="alert">{error}</p> : null}
      {current === 'want_to_talk' ? (
        <p className="mt-2 text-[13px] leading-snug text-[#3d4a57]">This stays on your account. It is not sent to a doctor. A visit request is how you ask the office to reach out.</p>
      ) : null}
    </div>
  )
}
