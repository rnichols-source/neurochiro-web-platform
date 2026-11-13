'use client'

import { useState } from 'react'
import { saveSettingsAction, sendDigestNowAction } from '@/app/(admin)/admin/founder-actions'

export function SettingsForm({
  figures,
  automations,
}: {
  figures: { followers: number; peopleUsed: number; peopleUsedApproximate: boolean }
  automations: { didYouGetIn: boolean; autoNudge: boolean; mondayDigest: boolean }
}) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setBusy(true)
        const result = await saveSettingsAction(formData)
        setMessage(result.message)
        setBusy(false)
      }}
    >
      <label className="block">
        <span className="fd-ui text-[13px] font-extrabold">Followers · your figure</span>
        <input name="followers" type="number" min={0} defaultValue={figures.followers} className="mt-1 min-h-12 w-full rounded-xl border border-[#D7DEE6] px-3" />
      </label>
      <label className="block">
        <span className="fd-ui text-[13px] font-extrabold">People who used NeuroChiro · your figure</span>
        <input name="peopleUsed" type="number" min={0} defaultValue={figures.peopleUsed} className="mt-1 min-h-12 w-full rounded-xl border border-[#D7DEE6] px-3" />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-[14px]">
        <input type="checkbox" name="approximate" defaultChecked={figures.peopleUsedApproximate} />
        Show this number with a ~
      </label>
      <div className="rounded-2xl bg-[#FFF7F1] p-4">
        <h2 className="fd-ui text-[16px] font-extrabold">Automatic messages</h2>
        <p className="mt-1 text-[13px] text-[#5b6773]">These stay off until you turn them on. A manual send still asks you to confirm the count.</p>
        <label className="mt-3 flex min-h-11 items-center gap-2 text-[14px]">
          <input type="checkbox" name="didYouGetIn" defaultChecked={automations.didYouGetIn} />
          “Did you get in?” 7 days after a visit request
        </label>
        <label className="flex min-h-11 items-center gap-2 text-[14px]">
          <input type="checkbox" name="autoNudge" defaultChecked={automations.autoNudge} />
          Auto-nudge doctors who ignore a request for 48 hours
        </label>
        <label className="flex min-h-11 items-center gap-2 text-[14px]">
          <input type="checkbox" name="mondayDigest" defaultChecked={automations.mondayDigest} />
          Monday Pulse email to drray@neurochirodirectory.com
        </label>
      </div>
      <button type="submit" disabled={busy} className="fd-ui min-h-12 rounded-2xl bg-[#1E2D3B] px-5 font-extrabold text-white">Save settings</button>
      <button
        type="button"
        disabled={busy}
        className="fd-ui ml-2 min-h-12 rounded-2xl border border-[#D7DEE6] px-4 font-extrabold"
        onClick={async () => {
          if (!window.confirm('Email today’s Pulse to drray@neurochirodirectory.com now?')) return
          setBusy(true)
          const result = await sendDigestNowAction()
          setMessage(result.message)
          setBusy(false)
        }}
      >
        Send digest now
      </button>
      {message ? <p className="text-[14px]">{message}</p> : null}
    </form>
  )
}
