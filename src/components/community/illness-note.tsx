'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteIllnessNote, saveIllnessNote } from '@/lib/community/library-actions'
import { LIBRARY_COPY } from '@/lib/community/library-model'
import { FormError } from '@/components/community/ui'

type Note = { id: string; startedOn: string; note: string | null; day: number }

export function IllnessNotes({ notes, today }: { notes: Note[]; today: string }) {
  const router = useRouter()
  const [startedOn, setStartedOn] = useState(today)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <div>
      <FormError message={error} />
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          start(async () => {
            const result = await saveIllnessNote({ startedOn, note })
            if (!result.ok) setError(result.error)
            else {
              setNote('')
              router.refresh()
            }
          })
        }}
      >
        <label className="block text-[12.5px] font-semibold text-[#3d4a57]">
          Day it started
          <input
            type="date"
            required
            max={today}
            value={startedOn}
            onChange={(event) => setStartedOn(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-[11px] border border-[#d9dfe5] px-3 text-[14px]"
          />
        </label>
        <label className="block text-[12.5px] font-semibold text-[#3d4a57]">
          Note, if you want one
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-[11px] border border-[#d9dfe5] px-3 py-2 text-[14px]"
          />
        </label>
        <button type="submit" disabled={pending} className="min-h-11 rounded-[11px] bg-neuro-navy px-3 text-[13px] font-semibold text-white disabled:opacity-60">
          {LIBRARY_COPY.illnessSave}
        </button>
      </form>
      {notes.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {notes.map((item) => (
            <li key={item.id} className="rounded-2xl bg-[#F5F3EF] px-3 py-2 text-[13px] text-[#16202a]">
              <p className="font-semibold">Day {item.day} · {item.startedOn}</p>
              {item.note ? <p className="mt-1 leading-snug">{item.note}</p> : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setError(null)
                  start(async () => {
                    const result = await deleteIllnessNote(item.id)
                    if (!result.ok) setError(result.error)
                    else router.refresh()
                  })
                }}
                className="mt-1 min-h-11 text-[13px] font-semibold text-[#B4501A]"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
