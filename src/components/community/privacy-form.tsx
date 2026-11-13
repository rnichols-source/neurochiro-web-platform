'use client'

import { useState, useTransition } from 'react'
import { savePrivacy } from '@/lib/community/actions'
import type { PrivacyPrefs } from '@/lib/community/logic'
import { FormError } from '@/components/community/ui'

const ROWS: { key: keyof PrivacyPrefs; label: string; detail: string }[] = [
  {
    key: 'shareNameWithHomeDoctor',
    label: 'My first name, with my home doctor',
    detail: 'Off until you turn it on. A visit request still asks again before anything is sent.',
  },
  {
    key: 'shareEmailWithHomeDoctor',
    label: 'My email, with my home doctor',
    detail: 'Only if you also check it on a visit request.',
  },
  {
    key: 'sharePhoneWithHomeDoctor',
    label: 'A phone number, with my home doctor',
    detail: 'You type the number on the visit request. It is not saved on your account.',
  },
  {
    key: 'shareFamilyFirstNamesWithHomeDoctor',
    label: 'Household first names, with my home doctor',
    detail: 'First names only. Relationship, notes, and emails stay here.',
  },
  {
    key: 'shareHomeClinicWithOtherDoctors',
    label: 'My home clinic, with a doctor I meet later',
    detail: 'For a future care passport. Off, and nothing is sent now.',
  },
]

export function PrivacyForm({ initial }: { initial: PrivacyPrefs }) {
  const [prefs, setPrefs] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  function toggle(key: keyof PrivacyPrefs) {
    setSaved(false)
    setPrefs((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        start(async () => {
          const result = await savePrivacy(prefs)
          if (!result.ok) setError(result.error)
          else setSaved(true)
        })
      }}
    >
      <FormError message={error} />
      <ul className="space-y-3">
        {ROWS.map((row) => {
          const on = prefs[row.key]
          return (
            <li key={row.key} className="rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-neuro-navy">{row.label}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-[#6b7785]">{row.detail}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggle(row.key)}
                  className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-neuro-orange' : 'bg-[#d9dfe5]'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${on ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-[11px] bg-neuro-navy text-[13.5px] font-semibold text-white disabled:opacity-60">
        {saved ? 'Saved' : pending ? 'Saving…' : 'Save choices'}
      </button>
      <p className="text-[12.5px] leading-snug text-[#6b7785]">These are the defaults for the next visit request. Nothing is shared by saving this page.</p>
    </form>
  )
}
