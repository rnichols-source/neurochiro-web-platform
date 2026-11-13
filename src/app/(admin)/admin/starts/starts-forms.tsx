'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addPatientStartAction, searchStartsDoctorsAction, updatePatientStartAction } from './actions'
import type { DoctorStartGroup, DoctorStartOption, PatientStartRow } from '@/lib/founder/patient-starts'
import { todayInNewYork } from '@/lib/founder/patient-starts-calc'

const fieldClass = 'mt-1 min-h-12 w-full rounded-xl border border-[#D7DEE6] px-3'
const labelClass = 'fd-ui text-[13px] font-extrabold'

export function AddStartForm() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<DoctorStartOption[]>([])
  const [doctor, setDoctor] = useState<DoctorStartOption | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (doctor || query.trim().length < 2) return
    const handle = window.setTimeout(() => {
      void searchStartsDoctorsAction(query).then(setMatches)
    }, 250)
    return () => window.clearTimeout(handle)
  }, [query, doctor])
  const suggestions = doctor || query.trim().length < 2 ? [] : matches

  async function onSubmit(formData: FormData) {
    setBusy(true)
    setMessage('')
    const result = await addPatientStartAction(formData)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setDoctor(null)
    setQuery('')
    setMessage('Saved.')
    router.refresh()
  }

  return (
    <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="doctor_id" value={doctor?.id || ''} />
      <label className="block md:col-span-2">
        <span className={labelClass}>Doctor</span>
        {doctor ? (
          <div className="mt-1 flex min-h-12 items-center justify-between rounded-xl border border-[#D7DEE6] px-3">
            <span>{doctor.name}{doctor.clinicName ? ` · ${doctor.clinicName}` : ''}{[doctor.city, doctor.state].filter(Boolean).length ? ` · ${[doctor.city, doctor.state].filter(Boolean).join(', ')}` : ''}</span>
            <button type="button" className="fd-ui min-h-11 px-2 font-extrabold text-[#B4501A]" onClick={() => { setDoctor(null); setQuery(''); setMatches([]) }}>Change</button>
          </div>
        ) : (
          <>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setMatches([]) }} placeholder="Search by name, clinic, or city" className={fieldClass} autoComplete="off" />
            {suggestions.length > 0 ? (
              <ul className="mt-1 overflow-hidden rounded-xl border border-[#D7DEE6] bg-white">
                {suggestions.map((match) => (
                  <li key={match.id}>
                    <button type="button" className="flex min-h-11 w-full items-start px-3 py-2 text-left text-[14px] hover:bg-[#F8F6F3]" onClick={() => { setDoctor(match); setQuery(match.name); setMatches([]) }}>
                      <span>
                        <span className="font-bold">{match.name}</span>
                        <span className="block text-[12px] text-[#5b6773]">{[match.clinicName, match.city, match.state].filter(Boolean).join(' · ')}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </label>
      <label className="block">
        <span className={labelClass}>Patients started</span>
        <input name="patients_started" type="number" min={0} step={1} required className={fieldClass} />
      </label>
      <label className="block">
        <span className={labelClass}>Reported on</span>
        <input name="reported_on" type="date" required defaultValue={todayInNewYork()} className={fieldClass} />
      </label>
      <label className="block">
        <span className={labelClass}>Care plan value (optional)</span>
        <input name="care_plan_value_usd" type="text" inputMode="decimal" placeholder="Leave blank if you do not know yet" className={fieldClass} />
      </label>
      <label className="block">
        <span className={labelClass}>Value source (optional)</span>
        <input name="value_source" type="text" className={fieldClass} />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-[14px] md:col-span-2">
        <input type="checkbox" name="value_is_estimate" defaultChecked />
        Mark the care plan value as an estimate
      </label>
      <label className="block md:col-span-2">
        <span className={labelClass}>Notes</span>
        <textarea name="notes" rows={2} className="mt-1 w-full rounded-xl border border-[#D7DEE6] px-3 py-2" />
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={busy} className="fd-ui min-h-12 rounded-2xl bg-[#1E2D3B] px-5 font-extrabold text-white disabled:opacity-60">Add report</button>
        {message ? <p className="mt-2 text-[13px] text-[#5b6773]">{message}</p> : null}
      </div>
    </form>
  )
}

export function EditStartForm({ report }: { report: PatientStartRow }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const initialValue = useMemo(() => (report.carePlanValueUsd == null ? '' : String(report.carePlanValueUsd)), [report.carePlanValueUsd])

  async function onSubmit(formData: FormData) {
    setBusy(true)
    setMessage('')
    const result = await updatePatientStartAction(formData)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.error)
      return
    }
    setMessage('Saved.')
    setOpen(false)
    router.refresh()
  }

  return (
    <div>
      <button type="button" className="fd-ui min-h-11 text-[13px] font-extrabold text-[#B4501A]" onClick={() => setOpen((value) => !value)}>
        {open ? 'Close' : 'Edit report'}
      </button>
      {open ? (
        <form action={onSubmit} className="mt-3 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={report.id} />
          <input type="hidden" name="doctor_id" value={report.doctorId} />
          <label className="block">
            <span className={labelClass}>Patients started</span>
            <input name="patients_started" type="number" min={0} step={1} required defaultValue={report.patientsStarted} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Reported on</span>
            <input name="reported_on" type="date" required defaultValue={report.reportedOn} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Care plan value (optional)</span>
            <input name="care_plan_value_usd" type="text" inputMode="decimal" defaultValue={initialValue} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Value source (optional)</span>
            <input name="value_source" type="text" defaultValue={report.valueSource || ''} className={fieldClass} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-[14px] md:col-span-2">
            <input type="checkbox" name="value_is_estimate" defaultChecked={report.valueIsEstimate} />
            Mark the care plan value as an estimate
          </label>
          <label className="block md:col-span-2">
            <span className={labelClass}>Notes</span>
            <textarea name="notes" rows={2} defaultValue={report.notes || ''} className="mt-1 w-full rounded-xl border border-[#D7DEE6] px-3 py-2" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={busy} className="fd-ui min-h-12 rounded-2xl bg-[#1E2D3B] px-5 font-extrabold text-white disabled:opacity-60">Save changes</button>
            {message ? <p className="mt-2 text-[13px] text-[#5b6773]">{message}</p> : null}
          </div>
        </form>
      ) : null}
    </div>
  )
}

export function DoctorReports({ group }: { group: DoctorStartGroup }) {
  return (
    <div className="space-y-3">
      {group.reports.map((report) => (
        <div key={report.id} className="rounded-2xl bg-[#F8F6F3] px-3 py-3">
          <p className="text-[13px] text-[#5b6773]">
            {report.patientsStarted} started · reported {report.reportedOn}
            {report.notes ? ` · ${report.notes}` : ''}
          </p>
          <EditStartForm report={report} />
        </div>
      ))}
    </div>
  )
}
