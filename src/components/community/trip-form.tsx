'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeTrip, saveTrip } from '@/lib/community/phase-actions'
import { TRIP_KIND_LABELS, type TripKind } from '@/lib/community/phases'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

export function TripForm() {
  const router = useRouter()
  const [place, setPlace] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [kind, setKind] = useState<TripKind>('trip')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        start(async () => {
          const result = await saveTrip({ place, startsOn, endsOn, kind })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setError(null)
          setPlace('')
          router.refresh()
        })
      }}
    >
      <FormError message={error} />
      <div>
        <FieldLabel>Where</FieldLabel>
        <input className={fieldClass} value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Denver, Colorado or London" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>From</FieldLabel>
          <input className={fieldClass} type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
        </div>
        <div>
          <FieldLabel>Until</FieldLabel>
          <input className={fieldClass} type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>What this is</FieldLabel>
        <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as TripKind)}>
          {(Object.keys(TRIP_KIND_LABELS) as TripKind[]).map((item) => (
            <option key={item} value={item}>{TRIP_KIND_LABELS[item]}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-[11px] bg-neuro-orange text-[13.5px] font-semibold text-white disabled:opacity-60">
        {pending ? 'Saving…' : 'Save this stay'}
      </button>
    </form>
  )
}

export function CloseTrip({ tripId, light = false }: { tripId: string; light?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className={`text-[13px] font-semibold ${light ? 'text-white/70' : 'text-[#6b7785]'}`}
      onClick={() => start(async () => {
        await closeTrip(tripId)
        router.refresh()
      })}
    >
      Close this stay
    </button>
  )
}
