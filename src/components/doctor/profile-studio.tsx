'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ALL_COUNTRIES } from '@/config/countries'
import { DoctorBand } from '@/components/doctor/chrome'
import { getDoctorProfile, updateDoctorProfile, uploadAvatar } from '@/app/(doctor)/doctor/profile/actions'
import { SPECIALTY_MAX, SPECIALTY_VOCABULARY } from '@/lib/specialty-vocabulary'
import { credentialedName, listingDisplayName } from '@/lib/listing-display'
import { initialsFrom, profileChecklist } from '@/lib/doctor/places'

type Owner = { name: string; credentials: string; photo_url: string; bio: string }
type Profile = Record<string, unknown>

const APPROACH = SPECIALTY_VOCABULARY.find((group) => group.label === 'Approach')?.terms || []

function lines(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join('\n')
  return typeof value === 'string' ? value : ''
}

function csv(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ')
  return typeof value === 'string' ? value : ''
}

function ownersFrom(value: unknown): Owner[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = item as Record<string, unknown>
    return {
      name: typeof row.name === 'string' ? row.name : '',
      credentials: typeof row.credentials === 'string' ? row.credentials : '',
      photo_url: typeof row.photo_url === 'string' ? row.photo_url : '',
      bio: typeof row.bio === 'string' ? row.bio : '',
    }
  }).filter((owner) => owner.name || owner.credentials)
}

function buildForm(profile: Profile, patch: {
  bio: string
  hours: string
  city: string
  state: string
  address: string
  country: string
  techniques: string[]
  owners: Owner[]
  listingFormat: string
}): FormData {
  const fd = new FormData()
  const set = (key: string, value: unknown) => fd.set(key, value == null ? '' : String(value))
  set('first_name', profile.first_name)
  set('last_name', profile.last_name)
  set('clinic_name', profile.clinic_name)
  set('city', patch.city)
  set('state', patch.state)
  set('country', patch.country || profile.country || 'US')
  set('zip_code', profile.zip_code)
  set('website', profile.website_url)
  set('bio', patch.bio)
  set('specialties', patch.techniques.join(', '))
  set('video_url', profile.video_url)
  set('seo_keywords', profile.seo_keywords)
  set('phone', profile.phone)
  set('instagram_url', profile.instagram_url)
  set('facebook_url', profile.facebook_url)
  set('tiktok_url', profile.tiktok_url)
  set('address', patch.address)
  set('hours', patch.hours)
  set('highlights', lines(profile.highlights))
  set('conditions_treated', csv(profile.conditions_treated))
  set('education', lines(profile.education))
  set('languages', csv(profile.languages))
  set('accepted_payment', csv(profile.accepted_payment))
  set('faq', JSON.stringify(Array.isArray(profile.faq) ? profile.faq : []))
  set('gallery_images', JSON.stringify(Array.isArray(profile.gallery_images) ? profile.gallery_images : []))
  set('booking_url', profile.booking_url)
  set('first_visit_info', profile.first_visit_info)
  set('parking_info', profile.parking_info)
  set('amenities', csv(profile.amenities))
  set('offers_telehealth', profile.offers_telehealth ? 'true' : 'false')
  set('accepts_walkins', profile.accepts_walkins ? 'true' : 'false')
  set('accepting_new_patients', profile.accepting_new_patients === false ? 'false' : 'true')
  set('accepts_student_messages', profile.accepts_student_messages ? 'true' : 'false')
  set('years_in_practice', profile.years_in_practice)
  set('insurance_networks', csv(profile.insurance_networks))
  set('team_members', JSON.stringify(Array.isArray(profile.team_members) ? profile.team_members : []))
  set('certifications', lines(profile.certifications))
  set('short_intro', profile.short_intro)
  set('philosophy', profile.philosophy)
  set('chiropractic_school', profile.chiropractic_school)
  set('degree', profile.degree)
  set('graduation_year', profile.graduation_year)
  set('post_doctoral_training', lines(profile.post_doctoral_training))
  set('google_reviews_url', profile.google_reviews_url)
  set('first_visit_price', profile.first_visit_price)
  set('payment_model', profile.payment_model)
  set('files_insurance', profile.files_insurance ? 'true' : 'false')
  set('payment_plans', profile.payment_plans ? 'true' : 'false')
  set('free_consultation', profile.free_consultation ? 'true' : 'false')
  set('has_evening_hours', profile.has_evening_hours ? 'true' : 'false')
  set('has_weekend_hours', profile.has_weekend_hours ? 'true' : 'false')
  if (patch.listingFormat === 'practice' || patch.listingFormat === 'lead') set('listing_format', patch.listingFormat)
  set('co_owners', JSON.stringify(patch.owners))
  return fd
}

export function ProfileStudio() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [open, setOpen] = useState('bio')
  const [bio, setBio] = useState('')
  const [hours, setHours] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('US')
  const [techniques, setTechniques] = useState<string[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [listingFormat, setListingFormat] = useState('lead')
  const [photo, setPhoto] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    getDoctorProfile().then((loaded) => {
      if (!loaded || !('clinic_name' in loaded || 'first_name' in loaded)) {
        setMissing(true)
        return
      }
      const row = loaded as Profile
      setProfile(row)
      setBio(typeof row.bio === 'string' ? row.bio : '')
      setHours(typeof row.hours === 'string' ? row.hours : '')
      setCity(typeof row.city === 'string' ? row.city : '')
      setState(typeof row.state === 'string' ? row.state : '')
      setAddress(typeof row.address === 'string' ? row.address : '')
      setCountry(typeof row.country === 'string' && row.country ? row.country : 'US')
      setTechniques(Array.isArray(row.specialties) ? row.specialties.map(String) : [])
      setOwners(ownersFrom(row.co_owners))
      setListingFormat(row.listing_format === 'practice' ? 'practice' : 'lead')
      setPhoto(typeof row.photo_url === 'string' ? row.photo_url : '')
    }).catch(() => setMissing(true))
  }, [])

  const checklist = useMemo(() => profileChecklist({
    photoUrl: photo,
    bio,
    shortIntro: typeof profile?.short_intro === 'string' ? profile.short_intro : null,
    listingFormat,
    coOwnerCount: owners.filter((owner) => owner.name.trim()).length,
    city,
    address,
    techniques: techniques.length,
    hours,
  }), [photo, bio, profile, listingFormat, owners, city, address, techniques, hours])

  const name = listingDisplayName({
    listing_format: listingFormat,
    clinic_name: typeof profile?.clinic_name === 'string' ? profile.clinic_name : null,
    first_name: typeof profile?.first_name === 'string' ? profile.first_name : null,
    last_name: typeof profile?.last_name === 'string' ? profile.last_name : null,
    co_owners: owners,
  })
  const ownerLine = listingFormat === 'practice'
    ? owners.map((owner) => credentialedName({ ...owner, credentials: owner.credentials || null, photo_url: owner.photo_url || null, bio: owner.bio || null })).filter(Boolean).join(' · ')
    : ''
  const slug = typeof profile?.slug === 'string' ? profile.slug : ''
  const left = checklist.remaining.length

  async function save() {
    if (!profile) return
    setSaving(true)
    setMessage('')
    const result = await updateDoctorProfile(buildForm(profile, { bio, hours, city, state, address, country, techniques, owners, listingFormat }))
    setSaving(false)
    setMessage(result.error || 'Saved')
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return
    const body = new FormData()
    body.set('file', file)
    setSaving(true)
    const result = await uploadAvatar(body)
    setSaving(false)
    if (result.publicUrl) setPhoto(result.publicUrl)
    setMessage(result.error || 'Photo updated')
  }

  function toggleTechnique(term: string) {
    setTechniques((current) => {
      if (current.includes(term)) return current.filter((item) => item !== term)
      if (current.length >= SPECIALTY_MAX) return current
      return [...current, term]
    })
  }

  if (missing) {
    return <p className="mt-6 text-[15px] text-[#5b6773]">A doctor profile is required before this editor can open.</p>
  }
  if (!profile) {
    return <p className="mt-6 text-[15px] text-[#5b6773]">Loading your profile…</p>
  }

  return (
    <div>
      <DoctorBand
        place="practice"
        title="Edit my profile"
        subtitle={left ? `${checklist.percent}% · ${left} to go` : 'Your profile is complete'}
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-2">
          <Section title="Photo" hint={photo ? 'Done' : 'Add a photo'} open={open === 'photo'} onToggle={() => setOpen(open === 'photo' ? '' : 'photo')} done={Boolean(photo)}>
            {photo ? <img src={photo} alt="" className="mb-3 h-20 w-20 rounded-full object-cover" /> : null}
            <input type="file" accept="image/*" onChange={(event) => onPhoto(event.target.files?.[0])} className="text-[14px]" />
          </Section>
          <Section title="Bio" hint="Add 2–3 sentences" open={open === 'bio'} onToggle={() => setOpen(open === 'bio' ? '' : 'bio')} done={checklist.steps.find((step) => step.key === 'bio')?.done || false}>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} className="w-full rounded-xl border border-[#E7E2D8] bg-[#F7F6F3] px-3 py-2 text-[15px]" />
          </Section>
          <Section title="Co-owners" hint={checklist.steps.find((step) => step.key === 'co_owners')?.hint || ''} open={open === 'owners'} onToggle={() => setOpen(open === 'owners' ? '' : 'owners')} done={checklist.steps.find((step) => step.key === 'co_owners')?.done || false}>
            {listingFormat !== 'practice' ? (
              <button type="button" className="dp-ui text-[14px] font-extrabold text-[#D66829]" onClick={() => { setListingFormat('practice'); setOwners((current) => current.length ? current : [{ name: '', credentials: '', photo_url: '', bio: '' }]) }}>
                List the practice with equal co-owners
              </button>
            ) : (
              <div className="space-y-2">
                {owners.map((owner, index) => (
                  <input
                    key={index}
                    value={owner.name}
                    placeholder="Name"
                    onChange={(event) => setOwners((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))}
                    className="h-11 w-full rounded-xl border border-[#E7E2D8] px-3 text-[15px]"
                  />
                ))}
                <button type="button" className="dp-ui text-[14px] font-extrabold text-[#1E2D3B]" onClick={() => setOwners((current) => [...current, { name: '', credentials: '', photo_url: '', bio: '' }])}>Add a co-owner</button>
              </div>
            )}
          </Section>
          <Section title="Locations" hint={city || 'Add a location'} open={open === 'location'} onToggle={() => setOpen(open === 'location' ? '' : 'location')} done={Boolean(city || address)}>
            <div className="grid gap-2">
              <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street" className="h-11 rounded-xl border border-[#E7E2D8] px-3 text-[15px]" />
              <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className="h-11 rounded-xl border border-[#E7E2D8] px-3 text-[15px]" />
              <input value={state} onChange={(event) => setState(event.target.value)} placeholder="State" className="h-11 rounded-xl border border-[#E7E2D8] px-3 text-[15px]" />
              <select value={country} onChange={(event) => setCountry(event.target.value)} className="h-11 rounded-xl border border-[#E7E2D8] px-3 text-[15px]">
                {ALL_COUNTRIES.map((item) => <option key={item.iso2} value={item.iso2}>{item.name}</option>)}
              </select>
            </div>
          </Section>
          <Section title="Techniques" hint={techniques.length ? `${techniques.length} listed` : 'Add at least one'} open={open === 'techniques'} onToggle={() => setOpen(open === 'techniques' ? '' : 'techniques')} done={techniques.length > 0}>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...APPROACH, ...techniques])].map((term) => {
                const on = techniques.includes(term)
                return (
                  <button key={term} type="button" onClick={() => toggleTechnique(term)} className={`dp-ui min-h-11 rounded-full px-3 text-[13px] font-extrabold ${on ? 'bg-[#1E2D3B] text-white' : 'bg-[#F5F3EF] text-[#15202B]'}`}>
                    {term}
                  </button>
                )
              })}
            </div>
          </Section>
          <Section title="Hours" hint={hours ? 'Done' : 'Add your hours'} open={open === 'hours'} onToggle={() => setOpen(open === 'hours' ? '' : 'hours')} done={Boolean(hours.trim())}>
            <textarea value={hours} onChange={(event) => setHours(event.target.value)} rows={3} placeholder="Mon–Thu 9–5" className="w-full rounded-xl border border-[#E7E2D8] px-3 py-2 text-[15px]" />
          </Section>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" onClick={save} disabled={saving} className="dp-ui h-12 rounded-2xl bg-[#D66829] px-5 text-[16px] font-extrabold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
            <Link href="/doctor/profile?full=1" className="dp-ui inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#1E2D3B]">All profile fields</Link>
            {message ? <p className="text-[14px] text-[#15202B]">{message}</p> : null}
          </div>
        </div>
        <aside className="h-fit rounded-[24px] bg-[#F4F7FA] p-4">
          <p className="dp-ui text-[11px] font-extrabold tracking-[0.1em] text-[#6b7785]" style={{ textTransform: 'uppercase' }}>Live preview · how community members see you</p>
          <div className="mt-3 rounded-[20px] bg-white p-4">
            <div className="flex items-center gap-3">
              {photo ? <img src={photo} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : (
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#1E2D3B] dp-ui text-[18px] font-extrabold text-white">{initialsFrom(name || 'Doctor')}</span>
              )}
              <div>
                <p className="dp-ui text-[18px] font-extrabold text-[#15202B]">{name || 'Your name'}</p>
                <p className="text-[13px] text-[#5b6773]">{[typeof profile.clinic_name === 'string' ? profile.clinic_name : '', [city, state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</p>
                {ownerLine ? <p className="text-[12px] text-[#5b6773]">{ownerLine}</p> : null}
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-snug text-[#15202B]">{bio || 'Your bio shows up here.'}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {techniques.slice(0, 4).map((term) => <span key={term} className="rounded-full bg-[#F5F3EF] px-2 py-1 text-[12px] font-bold text-[#15202B]">{term}</span>)}
            </div>
            <p className="mt-3 text-[13px] text-[#5b6773]">{hours || 'Hours not added yet'}</p>
            {slug ? (
              <a href={`https://neurochiro.co/directory/${slug}`} className="dp-ui mt-4 flex h-12 items-center justify-center rounded-2xl bg-[#D66829] text-[15px] font-extrabold text-white">Request a visit</a>
            ) : (
              <p className="dp-ui mt-4 flex h-12 items-center justify-center rounded-2xl bg-[#D66829] text-[15px] font-extrabold text-white">Request a visit</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Section({ title, hint, open, onToggle, done, children }: { title: string; hint: string; open: boolean; onToggle: () => void; done: boolean; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl bg-white ${open ? 'outline outline-2 outline-[#D66829]' : ''}`}>
      <button type="button" onClick={onToggle} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
        <span className={`grid h-6 w-6 place-items-center rounded-full text-[12px] font-extrabold ${done ? 'bg-[#E8F5EE] text-[#1f8a4c]' : 'bg-[#F5F3EF] text-[#6b7785]'}`}>{done ? 'OK' : ''}</span>
        <span className="min-w-0 flex-1">
          <span className="dp-ui block text-[15px] font-extrabold text-[#15202B]">{title}</span>
          <span className="block text-[13px] text-[#5b6773]">{hint}</span>
        </span>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  )
}
