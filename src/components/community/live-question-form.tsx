'use client'

import { useState, useTransition } from 'react'
import { askLiveQuestion } from '@/lib/community/phase-actions'
import { FormError, fieldClass } from '@/components/community/ui'

export function LiveQuestionForm() {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  return (
    <form
      className="space-y-2"
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
      <FormError message={error} />
      <textarea
        className={fieldClass}
        rows={3}
        maxLength={280}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="A question for the show"
      />
      <p className="text-[12.5px] leading-snug text-[#6b7785]">Your name is not shown with it. A question is not a visit, and NeuroChiro is not your doctor.</p>
      <button type="submit" disabled={pending} className="min-h-11 rounded-[11px] bg-neuro-navy px-4 text-[13.5px] font-semibold text-white disabled:opacity-60">
        {pending ? 'Saving…' : 'Send for the show'}
      </button>
      {saved ? <p className="text-[13px] text-[#1f8a4c]">Saved for the next Weekly Adjustment.</p> : null}
    </form>
  )
}
