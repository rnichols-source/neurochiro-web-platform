'use client'

import { useState } from 'react'
import { nudgeWaitingAction } from '@/app/(admin)/admin/founder-actions'

export function NudgeButton({ count }: { count: number }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="w-full text-left sm:w-auto sm:text-right">
      <button
        type="button"
        disabled={busy || count < 1}
        className="fd-ui inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#C2413B] px-3 text-[13px] font-extrabold text-white disabled:opacity-60 sm:w-auto"
        onClick={async () => {
          const doctors = count === 1 ? '1 doctor' : `${count} doctors`
          if (!window.confirm(`Send a reminder to ${doctors}?\n\nEach one has a patient visit request waiting 48 hours or more.\n\nEmail goes to doctors who have an email. An in-app note goes to doctors who have a login. A doctor with neither gets no message. No texts are sent. This does not reroute anyone.`)) return
          setBusy(true)
          const result = await nudgeWaitingAction(count)
          setMessage(result.message)
          setBusy(false)
        }}
      >
        Nudge all {count}
      </button>
      {message ? <p className="mt-1 text-[12px] text-[#3d4a57] sm:max-w-[220px]">{message}</p> : null}
    </div>
  )
}
