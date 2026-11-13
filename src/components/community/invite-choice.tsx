'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { chooseInvitedDoctor } from '@/lib/community/phase-actions'
import { FormError } from '@/components/community/ui'

export function InviteChoice({
  token,
  doctorId,
  community,
  hasHome,
}: {
  token: string
  doctorId: string
  community: boolean
  hasHome: boolean
}) {
  const router = useRouter()
  const [makeHome, setMakeHome] = useState(!hasHome)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  if (!community) return null

  return (
    <div className="mt-2 space-y-2">
      <FormError message={error} />
      <label className="flex items-center gap-2 text-[12.5px] text-[#3d4a57]">
        <input type="checkbox" checked={makeHome} onChange={(event) => setMakeHome(event.target.checked)} />
        Make them my home doctor
      </label>
      <button
        type="button"
        disabled={pending || saved}
        className="text-[13px] font-semibold text-[#B4501A] disabled:opacity-60"
        onClick={() => start(async () => {
          const result = await chooseInvitedDoctor({ token, doctorId, makeHome })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setSaved(true)
          router.refresh()
        })}
      >
        {saved ? 'Saved' : 'This is who I’ll see'}
      </button>
    </div>
  )
}
