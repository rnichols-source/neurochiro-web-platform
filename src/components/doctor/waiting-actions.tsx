'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { setRequestStage } from '@/lib/doctor/pipeline-actions'

export function WaitingActions({
  phone,
  sourceId,
  peopleHref,
}: {
  phone: string | null
  sourceId: string
  peopleHref: string
}) {
  const [note, setNote] = useState('')
  const [pending, start] = useTransition()
  const dial = (phone || '').replace(/[^\d+]/g, '')
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {dial ? (
          <a href={`tel:${dial}`} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#2C6BB4] px-5 text-[16px] font-extrabold text-white">Call</a>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => {
            const result = await setRequestStage('visit', sourceId, 'scheduled')
            setNote(result.ok ? 'Marked Scheduled.' : `${result.error} Try again.`)
          })}
          className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#1E2D3B] px-5 text-[16px] font-extrabold text-white"
        >
          {pending ? 'Saving...' : 'Mark scheduled'}
        </button>
        <Link href={peopleHref} className="dp-ui inline-flex h-[52px] items-center rounded-2xl bg-[#0E857A] px-5 text-[16px] font-extrabold text-white">
          Send a home plan
        </Link>
      </div>
      {note ? <p className="mt-2 text-[14px] font-bold text-[#15202B]" role="status">{note}</p> : null}
    </div>
  )
}
