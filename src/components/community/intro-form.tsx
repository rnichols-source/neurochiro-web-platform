'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendIntroduction } from '@/lib/community/phase-actions'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

type DoctorOption = { id: string; title: string }

export function IntroForm({
  tripId,
  doctors,
  hasName,
  hasHome,
  hasFamily,
  hasSharedSets,
  defaults,
}: {
  tripId: string
  doctors: DoctorOption[]
  hasName: boolean
  hasHome: boolean
  hasFamily: boolean
  hasSharedSets: boolean
  defaults: { name: boolean; clinic: boolean }
}) {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '')
  const [shareFirstName, setShareFirstName] = useState(defaults.name && hasName)
  const [shareHomeClinic, setShareHomeClinic] = useState(defaults.clinic && hasHome)
  const [shareFamily, setShareFamily] = useState(false)
  const [shareExercises, setShareExercises] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()

  if (doctors.length === 0) return null

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        setSaved(false)
        start(async () => {
          const result = await sendIntroduction({
            tripId,
            doctorId,
            shareFirstName,
            shareHomeClinic,
            shareFamily,
            shareExercises,
            note,
          })
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
      <FormError message={error} />
      <div>
        <FieldLabel>Doctor</FieldLabel>
        <select className={fieldClass} value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.title}</option>)}
        </select>
      </div>
      <fieldset className="space-y-2 rounded-[18px] bg-[#fdf1ea] px-3.5 py-3">
        <legend className="font-heading text-[13px] font-bold text-neuro-navy">Share with this introduction</legend>
        <Check label="My first name" checked={shareFirstName} disabled={!hasName} onChange={setShareFirstName} />
        <Check label="My home clinic" checked={shareHomeClinic} disabled={!hasHome} onChange={setShareHomeClinic} />
        <Check label="Household first names" checked={shareFamily} disabled={!hasFamily} onChange={setShareFamily} />
        <Check label="Set titles I marked for a passport" checked={shareExercises} disabled={!hasSharedSets} onChange={setShareExercises} />
        <p className="text-[12px] leading-snug text-[#6b7785]">Unchecked items stay here. This is not a chart, and it does not include email or phone.</p>
      </fieldset>
      <textarea className={fieldClass} rows={2} maxLength={280} value={note} onChange={(event) => setNote(event.target.value)} placeholder="A short hello, if you want one" />
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-[11px] bg-neuro-orange text-[13.5px] font-semibold text-white disabled:opacity-60">
        {pending ? 'Sending…' : 'Send introduction'}
      </button>
      {saved ? <p className="text-[13px] text-[#1f8a4c]">Sent. They only received what you checked.</p> : null}
    </form>
  )
}

function Check({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`flex items-center gap-2 text-[13.5px] text-neuro-navy ${disabled ? 'opacity-50' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}
