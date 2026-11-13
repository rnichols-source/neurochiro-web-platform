'use client'

import { useState } from 'react'
import { nudgeWaitingAction } from '@/app/(admin)/admin/founder-actions'

export function NudgeButton({ count }: { count: number }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="text-right">
      <button
        type="button"
        disabled={busy || count < 1}
        className="fd-ui inline-flex min-h-10 items-center rounded-xl bg-[#C2413B] px-3 text-[13px] font-extrabold text-white disabled:opacity-60"
        onClick={async () => {
          if (!window.confirm(`Send a reminder to ${count} doctors about requests waiting 48 hours or more? This does not reroute anyone.`)) return
          setBusy(true)
          const result = await nudgeWaitingAction(count)
          setMessage(result.message)
          setBusy(false)
        }}
      >
        Nudge all {count}
      </button>
      {message ? <p className="mt-1 max-w-[180px] text-[12px] text-[#3d4a57]">{message}</p> : null}
    </div>
  )
}
