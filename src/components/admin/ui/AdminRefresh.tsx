'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { refreshAdminDirectories } from '@/app/(admin)/admin/refresh-actions'

export function AdminRefresh({ at }: { at: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const parsed = new Date(at)
  const label = Number.isNaN(parsed.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    }).format(parsed)

  return (
    <div className="flex items-center gap-3">
      {label ? <span className="text-xs text-neuro-gray">Updated {label} ET</span> : null}
      <button
        type="button"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-4 text-sm font-medium text-white disabled:opacity-60"
        onClick={() => {
          start(async () => {
            await refreshAdminDirectories()
            router.refresh()
          })
        }}
      >
        {pending ? 'Refreshing' : 'Refresh'}
      </button>
    </div>
  )
}
