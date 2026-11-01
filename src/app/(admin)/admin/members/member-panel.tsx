'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { activateAfterOnboardingCall, updateDoctorManually } from '@/app/(admin)/admin/directory/actions'
import { staticMapUrl, type DoctorFormValues, type MemberDetail } from '@/lib/admin/member-search'

function when(value: string | null) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function Badge({ children }: { children: string }) {
  return <span className="inline-flex items-center rounded-full bg-neuro-cream px-2.5 py-1 text-xs font-medium text-neuro-navy">{children}</span>
}

export function MemberPanel({ detail, detailError }: { detail: MemberDetail | null; detailError: boolean }) {
  if (detailError) return <p className="text-sm text-neuro-gray">This profile could not be loaded.</p>
  if (!detail) return <p className="text-sm text-neuro-gray">This member was not found.</p>
  const place = [detail.city, detail.state, detail.country].filter(Boolean).join(', ')
  return (
    <div className="space-y-6 text-sm text-neuro-navy">
      <div className="space-y-2">
        <p className="text-base font-medium">{detail.practice || detail.role}</p>
        <p className="text-neuro-gray">{place || 'No location on file'}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>{detail.verificationLabel}</Badge>
          <Badge>{detail.billingLabel}</Badge>
        </div>
        {detail.slug ? (
          <a className="inline-flex min-h-11 items-center text-neuro-orange" href={`https://www.neurochiro.co/chiropractor/${encodeURIComponent(detail.slug)}`} target="_blank" rel="noreferrer">
            Public profile
          </a>
        ) : null}
      </div>
      <section className="space-y-1">
        <h3 className="font-heading text-base font-bold">Billing</h3>
        <p>Membership: {detail.membershipTier} · {detail.membershipSource}</p>
        <p>Record status: {detail.membershipStatus}</p>
        {detail.stripe.customerId ? (
          detail.stripe.unavailable ? <p>Stripe is unavailable.</p> : (
            <>
              <p>Subscription: {detail.stripe.status || 'No subscription'}</p>
              <p>Plan: {detail.stripe.plan || 'No plan'}{detail.stripe.amountLabel ? ` · ${detail.stripe.amountLabel}` : ''}</p>
              <p>Renews: {detail.stripe.renewsAt || 'Not scheduled'}</p>
              <p>Last invoice: {detail.stripe.lastInvoice || 'No invoices'}</p>
              <p>Failed payments: <span className="tabular-nums">{detail.stripe.failedPayments ?? 0}</span></p>
              <a className="inline-flex min-h-11 items-center text-neuro-orange" href={`https://dashboard.stripe.com/customers/${encodeURIComponent(detail.stripe.customerId)}`} target="_blank" rel="noreferrer">
                Open in Stripe
              </a>
            </>
          )
        ) : <p>No Stripe customer</p>}
      </section>
      <p>Last sign-in: {when(detail.lastSignIn)}</p>
      {detail.role === 'doctor' && detail.doctor ? <DoctorSections detail={detail} /> : null}
    </div>
  )
}

function DoctorSections({ detail }: { detail: MemberDetail }) {
  const doctor = detail.doctor
  if (!doctor) return null
  const place = [detail.city, detail.state].filter(Boolean).join(', ')
  return (
    <>
      <section className="space-y-2">
        <h3 className="font-heading text-base font-bold">Location</h3>
        {detail.location ? (
          <>
            {/* External OSM static map. It needs no API key and is not sent through the image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={staticMapUrl(detail.location.lat, detail.location.lng)} alt={place ? `Map near ${place}` : 'Practice map'} className="h-40 w-full rounded-xl object-cover" />
            <p className="tabular-nums text-neuro-gray">{detail.location.lat}, {detail.location.lng}</p>
          </>
        ) : (
          <>
            <p>No coordinates</p>
            <Link className="inline-flex min-h-11 items-center text-neuro-orange" href="/admin/coverage?tab=pins">Fix</Link>
          </>
        )}
      </section>
      <PanelActions detail={detail} />
      <DoctorEditor key={`${detail.id}:${detail.verificationLabel}:${detail.needsCall}`} detail={detail} />
      <section className="space-y-2">
        <h3 className="font-heading text-base font-bold">Contact requests</h3>
        <p className="tabular-nums text-neuro-gray">{doctor.contactTotal === null ? 'Count unavailable' : `${doctor.contactTotal} total`}</p>
        {doctor.contacts.length === 0 ? <p className="text-neuro-gray">No recent requests.</p> : (
          <ul className="space-y-2">
            {doctor.contacts.map((item) => (
              <li key={item.id} className="rounded-xl bg-neuro-cream px-3 py-2">
                <p>{item.name}</p>
                <p className="text-neuro-gray">{item.status} · {when(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-2">
        <h3 className="font-heading text-base font-bold">Introductions</h3>
        <p className="tabular-nums text-neuro-gray">{doctor.introductionTotal} total</p>
        {doctor.introductions.length === 0 ? <p className="text-neuro-gray">No introductions.</p> : (
          <ul className="space-y-2">
            {doctor.introductions.map((item, index) => (
              <li key={`${item.date}-${item.city}-${index}`} className="rounded-xl bg-neuro-cream px-3 py-2">
                <p>{[item.city, item.state].filter(Boolean).join(', ') || 'Unknown city'}</p>
                <p className="text-neuro-gray">{item.type} · {when(item.date)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-1">
        <h3 className="font-heading text-base font-bold">Routing</h3>
        {doctor.routing ? (
          <p className="tabular-nums text-neuro-gray">
            {doctor.routing.total} introductions · {doctor.routing.last7} in 7 days · {doctor.routing.last30} in 30 days · {doctor.routing.profileClicks} profile clicks · {doctor.routing.actionClicks} action clicks
          </p>
        ) : <p className="text-neuro-gray">No routing stats.</p>}
      </section>
    </>
  )
}

function PanelActions({ detail }: { detail: MemberDetail }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(false)

  async function approve() {
    setPending(true)
    setMessage('')
    const result = await activateAfterOnboardingCall(detail.id)
    setPending(false)
    if (!result.success) {
      setMessage(result.error || 'Could not activate this doctor.')
      return
    }
    router.refresh()
  }

  async function hide() {
    setPending(true)
    setMessage('')
    const result = await updateDoctorManually(detail.id, { verification_status: 'hidden' })
    setPending(false)
    if (!result.success) {
      setMessage(result.error || 'Could not hide this doctor.')
      return
    }
    router.refresh()
  }

  async function copyEmail() {
    if (!detail.email) return
    try {
      await navigator.clipboard.writeText(detail.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setMessage('Clipboard is unavailable.')
    }
  }

  return (
    <section className="space-y-2">
      <h3 className="font-heading text-base font-bold">Actions</h3>
      <div className="flex flex-wrap gap-2">
        {detail.role === 'doctor' && detail.needsCall ? (
          <button type="button" disabled={pending} onClick={() => void approve()} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-3 text-white disabled:opacity-60">
            Approve
          </button>
        ) : null}
        {detail.role === 'doctor' ? (
          <button type="button" disabled={pending} onClick={() => void hide()} className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-3">
            Hide
          </button>
        ) : null}
        <button type="button" disabled={!detail.email} onClick={() => void copyEmail()} className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-3 disabled:opacity-60">
          {copied ? 'Copied' : 'Copy email'}
        </button>
        {detail.stripe.customerId ? (
          <a className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-3" href={`https://dashboard.stripe.com/customers/${encodeURIComponent(detail.stripe.customerId)}`} target="_blank" rel="noreferrer">
            Open in Stripe
          </a>
        ) : null}
        <Link className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-3" href="/admin/leads?tab=requests">
          Resend lead
        </Link>
      </div>
      {message ? <p className="text-neuro-gray">{message}</p> : null}
    </section>
  )
}

function DoctorEditor({ detail }: { detail: MemberDetail }) {
  const doctor = detail.doctor
  const router = useRouter()
  const [form, setForm] = useState<DoctorFormValues>(doctor?.form || {
    first_name: '', last_name: '', email: '', slug: '', clinic_name: '', address: '', city: '', state: '', country: '',
    latitude: '', longitude: '', bio: '', website_url: '', instagram_url: '', verification_status: 'pending',
    short_intro: '', philosophy: '', chiropractic_school: '', graduation_year: '',
  })
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  if (!doctor) return null

  function setField(key: keyof DoctorFormValues, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    setPending(true)
    setMessage('')
    const result = await updateDoctorManually(detail.id, { ...form })
    setPending(false)
    if (!result.success) {
      setMessage(result.error || 'Could not save.')
      return
    }
    setMessage('Saved.')
    router.refresh()
  }

  const fields: { key: keyof DoctorFormValues; label: string; area?: boolean }[] = [
    { key: 'first_name', label: 'First name' },
    { key: 'last_name', label: 'Last name' },
    { key: 'email', label: 'Email' },
    { key: 'slug', label: 'Slug' },
    { key: 'clinic_name', label: 'Practice' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'website_url', label: 'Website' },
    { key: 'instagram_url', label: 'Instagram' },
    { key: 'chiropractic_school', label: 'School' },
    { key: 'graduation_year', label: 'Graduation year' },
    { key: 'short_intro', label: 'Short intro', area: true },
    { key: 'philosophy', label: 'Philosophy', area: true },
    { key: 'bio', label: 'Bio', area: true },
  ]

  return (
    <section className="space-y-3">
      <h3 className="font-heading text-base font-bold">Edit profile</h3>
      <p className="text-neuro-gray">Membership is {detail.membershipTier} from {detail.membershipSource}. It is not edited here.</p>
      <label className="block space-y-1">
        <span>Verification</span>
        <select value={form.verification_status} onChange={(event) => setField('verification_status', event.target.value)} className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-3">
          {['pending', 'verified', 'hidden', form.verification_status].filter((value, index, list) => value && list.indexOf(value) === index).map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      {fields.map((field) => (
        <label key={field.key} className="block space-y-1">
          <span>{field.label}</span>
          {field.area ? (
            <textarea value={form[field.key]} onChange={(event) => setField(field.key, event.target.value)} rows={3} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2" />
          ) : (
            <input value={form[field.key]} onChange={(event) => setField(field.key, event.target.value)} className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-3" />
          )}
        </label>
      ))}
      <button type="button" disabled={pending} onClick={() => void save()} className="inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-white disabled:opacity-60">
        Save
      </button>
      {message ? <p className="text-neuro-gray">{message}</p> : null}
    </section>
  )
}
