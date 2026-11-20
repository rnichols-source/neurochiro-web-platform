'use client'

import { useState, useTransition } from 'react'
import { markRemedyCheckin } from '@/lib/community/library-actions'

export type SentRemedyItem = {
  id: string
  name: string
  howOften: string
  doneToday: boolean
}

export function SentRemedies({ items }: { items: SentRemedyItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')
  const [pending, start] = useTransition()
  if (!items.length) return null
  return (
    <section className="mb-4 rounded-[18px] border border-[#BFE3DD] bg-[#DCF1EE] px-4 py-3">
      <h2 className="text-[16px] font-extrabold text-[#15202B]">From your doctor</h2>
      <p className="mt-1 text-[13px] leading-snug text-[#3d4a57]">These are the remedies your doctor sent. The full guide is below. Your doctor can see which days you mark done.</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const marked = done[item.id] || item.doneToday
          return (
            <li key={item.id} className="rounded-xl bg-white px-3 py-3">
              <p className="text-[15px] font-extrabold text-[#15202B]">{item.name}</p>
              <p className="text-[13px] text-[#5b6773]">{item.howOften}</p>
              <button
                type="button"
                disabled={pending || marked}
                onClick={() => start(async () => {
                  const result = await markRemedyCheckin(item.id)
                  if (!result.ok) {
                    setNote(result.error)
                    return
                  }
                  setDone((current) => ({ ...current, [item.id]: true }))
                  setNote('Marked for today.')
                })}
                className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-[#0E857A] px-3 text-[14px] font-extrabold text-white disabled:opacity-60"
              >
                {marked ? 'Done today' : 'I did this today'}
              </button>
            </li>
          )
        })}
      </ul>
      {note ? <p className="mt-2 text-[13px] text-[#15202B]" role="status">{note}</p> : null}
    </section>
  )
}
