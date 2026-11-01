'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { refreshAdminToday } from './today-actions'

export function TodayRefresh() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-4 text-sm font-medium text-white disabled:opacity-60"
      onClick={() => {
        start(async () => {
          await refreshAdminToday()
          router.refresh()
        })
      }}
    >
      {pending ? 'Refreshing' : 'Refresh'}
    </button>
  )
}
