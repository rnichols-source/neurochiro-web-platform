'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignExerciseSet } from '@/lib/community/phase-actions'

export function AssignForm({ members }: { members: { id: string; label: string }[] }) {
  const router = useRouter()
  const [profileId, setProfileId] = useState(members[0]?.id || '')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [stepsText, setStepsText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  if (members.length === 0) {
    return <p className="text-sm text-portal-ink-2">When a community member chooses you as their home doctor, you can assign a set in your own words.</p>
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSaved(false)
        start(async () => {
          const result = await assignExerciseSet({ profileId, title, note, stepsText })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setError(null)
          setSaved(true)
          setTitle('')
          setNote('')
          setStepsText('')
          router.refresh()
        })
      }}
    >
      {error ? <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-neuro-orange" role="alert">{error}</p> : null}
      <label className="block text-sm font-semibold text-portal-ink">
        Community member
        <select className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-sm" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
          {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-portal-ink">
        Title
        <input className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-sm font-normal" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold text-portal-ink">
        Note
        <input className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-sm font-normal" value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold text-portal-ink">
        Steps, one per line
        <textarea className="mt-1 w-full rounded-lg border border-portal-border px-3 py-2 text-sm font-normal" rows={5} value={stepsText} onChange={(event) => setStepsText(event.target.value)} />
      </label>
      <p className="text-sm text-portal-ink-2">One to eight steps, in your own words. This is separate from a library plan.</p>
      <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-neuro-orange px-4 text-sm font-bold text-white disabled:opacity-60">
        {pending ? 'Assigning…' : 'Assign this set'}
      </button>
      {saved ? <p className="text-sm text-portal-ink">Assigned. They will see it in Your NeuroChiro.</p> : null}
    </form>
  )
}
