'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setHomeDoctor } from '@/lib/community/actions'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

type Result = {
  id: string
  title: string
  place: string
  initials: string
}

export function FindDoctor({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Result[]>([])
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [searching, setSearching] = useState(false)

  async function search(event: React.FormEvent) {
    event.preventDefault()
    const term = query.trim()
    if (term.length < 2) {
      setError('Enter a city, state, or postal code.')
      return
    }
    setError(null)
    setSearching(true)
    try {
      const response = await fetch(`/api/directory/search?location=${encodeURIComponent(term)}&limit=8`)
      const body = await response.json()
      const doctors = Array.isArray(body.doctors) ? body.doctors : []
      setHint(typeof body.locationLabel === 'string' ? body.locationLabel : null)
      setResults(doctors.slice(0, 8).map((doctor: Record<string, string | null>) => {
        const practice = (doctor.listing_format === 'practice' && doctor.clinic_name) ? doctor.clinic_name : ''
        const person = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.replace(/\s+/g, ' ').trim()
        const title = practice || (person === 'Dr.' ? 'NeuroChiro doctor' : person)
        const city = doctor.city || doctor.state || ''
        const initials = practice
          ? practice.split(/\s+/).slice(0, 2).map((word) => word[0] || '').join('').toUpperCase()
          : `${doctor.first_name?.[0] || ''}${doctor.last_name?.[0] || ''}`.toUpperCase()
        return { id: String(doctor.id), title, place: city, initials: initials || 'NC' }
      }))
      if (doctors.length === 0) setError('No listed doctor matched that place.')
    } catch {
      setError('The directory search did not respond. Try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="space-y-2">
        <FieldLabel>City, state, or postal code</FieldLabel>
        <input className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Austin or 78701" />
        <button type="submit" disabled={searching} className="min-h-11 w-full rounded-[11px] bg-neuro-navy text-[13.5px] font-semibold text-white disabled:opacity-60">
          {searching ? 'Searching…' : 'Search the directory'}
        </button>
      </form>
      <FormError message={error} />
      {hint ? <p className="text-[12.5px] text-[#6b7785]">{hint}</p> : null}
      <ul className="divide-y divide-[#eee] rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-3.5">
        {results.map((doctor) => (
          <li key={doctor.id} className="flex items-center gap-3 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8eef3] font-heading text-[14px] font-bold text-neuro-navy">{doctor.initials}</div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[15px] font-bold text-neuro-navy">{doctor.title}</p>
              {doctor.place ? <p className="text-[12px] text-[#6b7785]">{doctor.place}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button
                type="button"
                disabled={pending}
                className="whitespace-nowrap text-[13px] font-semibold text-[#B4501A]"
                onClick={() => start(async () => {
                  const result = await setHomeDoctor(doctor.id)
                  if (!result.ok) setError(result.error)
                  else router.push('/portal')
                })}
              >
                Home doctor
              </button>
              <button
                type="button"
                className="whitespace-nowrap text-[12px] font-semibold text-neuro-navy"
                onClick={() => router.push(`/portal/visit?doctor=${doctor.id}`)}
              >
                Request
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
