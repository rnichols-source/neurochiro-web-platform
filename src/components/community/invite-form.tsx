'use client'

import { useState, useTransition } from 'react'
import { createInvitation } from '@/lib/community/phase-actions'
import { invitationShareLinks } from '@/lib/community/phases'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

type Result = { id: string; title: string; place: string }

export function InviteForm() {
  const [words, setWords] = useState('')
  const [place, setPlace] = useState('')
  const [note, setNote] = useState('')
  const [includeNote, setIncludeNote] = useState(false)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [searching, setSearching] = useState(false)
  const [pending, start] = useTransition()

  async function searchDoctors() {
    const term = place.trim()
    if (term.length < 2) {
      setError('Say a city, a state, or a country first.')
      return
    }
    setSearching(true)
    setError(null)
    try {
      const response = await fetch(`/api/directory/search?location=${encodeURIComponent(term)}&country=ALL&limit=8`)
      const body = await response.json()
      const doctors = Array.isArray(body.doctors) ? body.doctors : []
      setResults(doctors.slice(0, 8).map((doctor: Record<string, string | null>) => {
        const practice = doctor.listing_format === 'practice' && doctor.clinic_name ? doctor.clinic_name : ''
        const person = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.replace(/\s+/g, ' ').trim()
        const title = practice || (person === 'Dr.' ? 'NeuroChiro doctor' : person)
        return { id: String(doctor.id), title, place: [doctor.city, doctor.state].filter(Boolean).join(', ') }
      }))
      if (doctors.length === 0) setError('No listed doctor matched yet. You can still send a general invitation.')
    } catch {
      setError('The directory did not respond. You can still send a general invitation.')
    } finally {
      setSearching(false)
    }
  }

  const links = message ? invitationShareLinks(message) : null

  return (
    <div className="space-y-3">
      <FormError message={error} />
      <div>
        <FieldLabel>Who is this for?</FieldLabel>
        <input className={fieldClass} value={words} onChange={(event) => setWords(event.target.value)} placeholder="My grandson" />
      </div>
      <div>
        <FieldLabel>Where they are</FieldLabel>
        <input className={fieldClass} value={place} onChange={(event) => setPlace(event.target.value)} placeholder="London, Austin, or Canada" />
      </div>
      <button type="button" onClick={searchDoctors} disabled={searching} className="min-h-11 w-full rounded-[11px] bg-neuro-navy text-[13.5px] font-semibold text-white disabled:opacity-60">
        {searching ? 'Looking…' : 'Show doctors near them'}
      </button>
      {results.length > 0 ? (
        <ul className="divide-y divide-[#eee] rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-3.5">
          <li className="py-3">
            <button type="button" className="text-[13.5px] font-semibold text-neuro-navy" onClick={() => setDoctorId(null)}>
              {doctorId ? 'Send a general invitation instead' : 'General invitation, so they can choose'}
            </button>
          </li>
          {results.map((doctor) => (
            <li key={doctor.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-heading text-[15px] font-bold text-neuro-navy">{doctor.title}</p>
                {doctor.place ? <p className="text-[12px] text-[#6b7785]">{doctor.place}</p> : null}
              </div>
              <button type="button" className="text-[13px] font-semibold text-[#B4501A]" onClick={() => setDoctorId(doctor.id)}>
                {doctorId === doctor.id ? 'Picked' : 'Pick'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="flex items-center gap-2 text-[13.5px] text-neuro-navy">
        <input type="checkbox" checked={includeNote} onChange={(event) => setIncludeNote(event.target.checked)} />
        Include a short note
      </label>
      {includeNote ? (
        <textarea className={fieldClass} rows={3} maxLength={280} value={note} onChange={(event) => setNote(event.target.value)} placeholder="You asked who to see." />
      ) : null}
      <button
        type="button"
        disabled={pending}
        className="min-h-11 w-full rounded-[11px] bg-neuro-orange text-[13.5px] font-semibold text-white disabled:opacity-60"
        onClick={() => start(async () => {
          const result = await createInvitation({
            recipientWords: words,
            place,
            note: includeNote ? note : '',
            doctorId,
          })
          if (!result.ok) {
            setError(result.error)
            setMessage(null)
            return
          }
          setError(null)
          setMessage(result.message)
          setCopied(false)
        })}
      >
        {pending ? 'Preparing…' : 'Create a private link'}
      </button>
      {message && links ? (
        <div className="rounded-[18px] bg-[#15202B] px-4 py-4 text-white">
          <p className="text-[12px] font-semibold text-white/70">Private message</p>
          <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed">{message}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-[13px] font-semibold">
            <button
              type="button"
              className="text-[#F3C2A4]"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message)
                  setCopied(true)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a className="text-[#F3C2A4]" href={links.sms}>Text</a>
            <a className="text-[#F3C2A4]" href={links.email}>Email</a>
            <a className="text-[#F3C2A4]" href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
          <p className="mt-3 text-[12px] leading-snug text-white/70">This is not posted anywhere. You send it the way you already talk to them.</p>
        </div>
      ) : null}
    </div>
  )
}
