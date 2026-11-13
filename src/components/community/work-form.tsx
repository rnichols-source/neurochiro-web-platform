'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeWorkInterest, saveWorkInterest } from '@/lib/community/phase-actions'
import { WORK_PATH_LABELS, type WorkPath } from '@/lib/community/phases'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

export function WorkForm() {
  const router = useRouter()
  const [path, setPath] = useState<WorkPath>('ca')
  const [place, setPlace] = useState('')
  const [note, setNote] = useState('')
  const [shareContact, setShareContact] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        start(async () => {
          const result = await saveWorkInterest({ path, place, note, shareContact })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setError(null)
          setNote('')
          router.refresh()
        })
      }}
    >
      <FormError message={error} />
      <div>
        <FieldLabel>Path</FieldLabel>
        <select className={fieldClass} value={path} onChange={(event) => setPath(event.target.value as WorkPath)}>
          {(Object.keys(WORK_PATH_LABELS) as WorkPath[]).map((item) => (
            <option key={item} value={item}>{WORK_PATH_LABELS[item]}</option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Where you are</FieldLabel>
        <input className={fieldClass} value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Austin, TX" />
      </div>
      <textarea className={fieldClass} rows={3} maxLength={280} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why this work, in a sentence or two" />
      <label className="flex items-start gap-2 text-[13px] text-[#3d4a57]">
        <input type="checkbox" className="mt-1" checked={shareContact} onChange={(event) => setShareContact(event.target.checked)} />
        <span>Share my first name and email with an office that connects. Off, they only see the path, the place, and this note.</span>
      </label>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-[11px] bg-neuro-orange text-[13.5px] font-semibold text-white disabled:opacity-60">
        {pending ? 'Saving…' : 'Raise a hand'}
      </button>
    </form>
  )
}

export function CloseInterest({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className="text-[13px] font-semibold text-[#6b7785]"
      onClick={() => start(async () => {
        await closeWorkInterest(id)
        router.refresh()
      })}
    >
      Lower this hand
    </button>
  )
}
