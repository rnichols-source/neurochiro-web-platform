'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignLibraryPlan } from '@/lib/community/library-actions'
import { LIBRARY_COPY } from '@/lib/community/library-model'

export function AssignLibraryForm({
  slug,
  members,
  assignedIds,
}: {
  slug: string
  members: { id: string; label: string }[]
  assignedIds: string[]
}) {
  const router = useRouter()
  const [profileId, setProfileId] = useState(members[0]?.id || '')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()
  const assigned = new Set(assignedIds)

  if (members.length === 0) {
    return <p className="text-sm text-portal-ink-2">When a community member chooses you as their home doctor, you can assign this plan.</p>
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSaved(false)
        start(async () => {
          const result = await assignLibraryPlan({ profileId, slug, note })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setError(null)
          setSaved(true)
          setNote('')
          router.refresh()
        })
      }}
    >
      {error ? <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-neuro-orange" role="alert">{error}</p> : null}
      <label className="block text-sm font-semibold text-portal-ink">
        Community member
        <select className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-sm font-normal" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}{assigned.has(member.id) ? ' · assigned' : ''}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-portal-ink">
        {LIBRARY_COPY.noteLabel}
        <input className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-sm font-normal" value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <p className="text-sm text-portal-ink-2">{LIBRARY_COPY.noteHint}</p>
      <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-neuro-orange px-4 text-sm font-bold text-white disabled:opacity-60">
        {pending ? 'Assigning…' : LIBRARY_COPY.assignPlan}
      </button>
      {saved ? <p className="text-sm text-portal-ink">{LIBRARY_COPY.assignedSaved}</p> : null}
    </form>
  )
}
