'use client'

import { useState, useTransition } from 'react'
import { requestVisit } from '@/lib/community/actions'
import type { PrivacyPrefs } from '@/lib/community/logic'
import { FieldLabel, FormError, fieldClass } from '@/components/community/ui'

type Person = { id: string; firstName: string }

const WINDOWS = ['', 'Weekday morning', 'Weekday afternoon', 'Evening', 'No preference']

export function VisitForm({
  doctorId,
  doctorTitle,
  people,
  privacy,
  hasEmail,
}: {
  doctorId: string
  doctorTitle: string
  people: Person[]
  privacy: PrivacyPrefs
  hasEmail: boolean
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [forMemberId, setForMemberId] = useState('')
  const [shareFirstName, setShareFirstName] = useState(privacy.shareNameWithHomeDoctor)
  const [shareForName, setShareForName] = useState(false)
  const [shareEmail, setShareEmail] = useState(privacy.shareEmailWithHomeDoctor && hasEmail)
  const [sharePhone, setSharePhone] = useState(false)
  const [shareFamily, setShareFamily] = useState(privacy.shareFamilyFirstNamesWithHomeDoctor && people.length > 0)
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [windowChoice, setWindowChoice] = useState('')

  if (done) {
    return (
      <div className="rounded-[18px] bg-[#e8f5ee] px-4 py-4 text-[14px] leading-relaxed text-[#1f8a4c]">
        <p className="font-heading text-[16px] font-bold text-neuro-navy">Request saved</p>
        <p className="mt-1 text-[#3d4a57]">{done}</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        start(async () => {
          const params = new URLSearchParams(window.location.search)
          const result = await requestVisit({
            doctorId,
            shareFirstName,
            shareForName: Boolean(forMemberId) && shareForName,
            shareEmail,
            sharePhone,
            shareFamilyFirstNames: shareFamily,
            forMemberId: forMemberId || null,
            phone,
            note,
            preferredWindow: windowChoice,
            source: params.get('source'),
            utmSource: params.get('utm_source'),
            utmCampaign: params.get('utm_campaign'),
            utmContent: params.get('utm_content'),
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          const office = [
            result.emailed ? 'The office was emailed what you checked.' : '',
            result.texted ? 'A text was sent to the office.' : '',
            result.textHeld ? 'A text is held until the office’s morning hours.' : '',
          ].filter(Boolean)
          if (office.length > 0) {
            setDone(`Saved. ${office.join(' ')} Nothing else was included.`)
          } else if (!result.claimed) {
            setDone('Saved. This office does not have a NeuroChiro login yet, so they will not get an in-app alert. Your request is still on your account.')
          } else if (result.notified) {
            setDone(`${doctorTitle} has an alert in their NeuroChiro account. They only received what you checked. Email or text was not sent just now.`)
          } else {
            setDone('Saved on your account. The office alert could not be delivered just now. They can still see it under visit requests when they sign in.')
          }
        })
      }}
    >
      <FormError message={error} />
      <div>
        <FieldLabel>Who is this for?</FieldLabel>
        <select className={fieldClass} value={forMemberId} onChange={(event) => setForMemberId(event.target.value)}>
          <option value="">Me</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.firstName}</option>)}
        </select>
      </div>
      <div>
        <FieldLabel>A good time</FieldLabel>
        <select className={fieldClass} value={windowChoice} onChange={(event) => setWindowChoice(event.target.value)}>
          {WINDOWS.map((item) => <option key={item || 'none'} value={item}>{item || 'No time yet'}</option>)}
        </select>
      </div>
      <div>
        <FieldLabel>Note for scheduling</FieldLabel>
        <textarea className={fieldClass} rows={3} maxLength={400} value={note} onChange={(event) => setNote(event.target.value)} placeholder="A weekday morning works. Leave symptoms out." />
      </div>
      <fieldset className="space-y-2 rounded-[18px] bg-[#fdf1ea] px-3.5 py-3">
        <legend className="font-heading text-[13px] font-bold text-neuro-navy">Share with this office</legend>
        <Check label="My first name" checked={shareFirstName} onChange={setShareFirstName} />
        {forMemberId ? <Check label="Their first name" checked={shareForName} onChange={setShareForName} /> : null}
        <Check label="My email" checked={shareEmail} onChange={setShareEmail} disabled={!hasEmail} />
        <Check label="A phone number for this request" checked={sharePhone} onChange={setSharePhone} />
        {sharePhone ? (
          <input className={fieldClass} inputMode="tel" autoComplete="tel" placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        ) : null}
        <Check label="Household first names" checked={shareFamily} onChange={setShareFamily} disabled={people.length === 0} />
        <p className="text-[12px] leading-snug text-[#6b7785]">Unchecked boxes stay here. Saving your privacy settings does not send them.</p>
      </fieldset>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-[11px] bg-neuro-orange text-[13.5px] font-semibold text-white disabled:opacity-60">
        {pending ? 'Sending…' : 'Request a visit'}
      </button>
    </form>
  )
}

function Check({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2 text-[13.5px] text-neuro-navy ${disabled ? 'opacity-50' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}
