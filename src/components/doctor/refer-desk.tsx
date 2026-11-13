'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { searchNetworkDoctors, sendWarmIntro, type DoctorHit } from '@/app/(doctor)/doctor/network/actions'
import type { ReferralCard } from '@/lib/doctor/portal-data'
import { EmptyNote } from '@/components/doctor/chrome'

export function ReferDesk({
  sent,
  received,
  trusted,
  initialWho = '',
}: {
  sent: ReferralCard[]
  received: ReferralCard[]
  trusted: number
  initialWho?: string
}) {
  const [who, setWho] = useState(initialWho)
  const [initial, setInitial] = useState('')
  const [where, setWhere] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [consent, setConsent] = useState(false)
  const [doctors, setDoctors] = useState<DoctorHit[]>([])
  const [choices, setChoices] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'sent' | 'received'>('sent')
  const [pending, start] = useTransition()
  const rows = tab === 'sent' ? sent : received

  function search(nextWhere?: string) {
    const place = (nextWhere ?? where).trim()
    setMessage('')
    start(async () => {
      const result = await searchNetworkDoctors(place)
      setDoctors(result.doctors)
      setChoices(result.choices)
      setNote([result.label, result.note].filter(Boolean).join(' '))
    })
  }

  function send(doctorId: string) {
    setMessage('')
    start(async () => {
      const result = await sendWarmIntro({
        receivingDoctorId: doctorId,
        firstName: who,
        lastInitial: initial,
        phone,
        email,
        reason: reason || (where ? `Moving toward ${where}` : 'Warm introduction'),
        consent,
      })
      setMessage(result.message)
      if (result.ok) setConsent(false)
    })
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
      <div>
        <section className="rounded-[24px] bg-[#7A4A94] p-5 text-white">
          <h2 className="dp-ui text-[22px] font-extrabold tracking-[-0.02em]">Refer a community member</h2>
          <p className="mt-1 text-[14px] leading-snug text-white/90">You can refer anywhere in the world. Type a doctor’s name, a city, a state, a country, or a postal code — London, Sydney Australia, Toronto, or 90210. The nearest NeuroChiro doctors come up. Their phone is shared only after that doctor accepts.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-[13px] font-bold">
              Who
              <input value={who} onChange={(event) => setWho(event.target.value)} placeholder="First name" className="mt-1 h-12 w-full rounded-xl border-0 bg-white px-3 text-[16px] text-[#15202B]" />
            </label>
            <label className="block text-[13px] font-bold">
              Last initial
              <input value={initial} onChange={(event) => setInitial(event.target.value.slice(0, 1))} placeholder="S" className="mt-1 h-12 w-full rounded-xl border-0 bg-white px-3 text-[16px] text-[#15202B]" />
            </label>
            <label className="block text-[13px] font-bold sm:col-span-2">
              Where
              <span className="mt-1 flex gap-2">
                <input value={where} onChange={(event) => setWhere(event.target.value)} placeholder="London, Sydney Australia, Toronto, 90210" className="h-12 min-w-0 flex-1 rounded-xl border-0 bg-white px-3 text-[16px] text-[#15202B]" />
                <button type="button" onClick={() => search()} disabled={pending} className="dp-ui h-12 rounded-xl bg-white px-4 text-[14px] font-extrabold text-[#5C3473] disabled:opacity-60">Find</button>
              </span>
            </label>
            <label className="block text-[13px] font-bold">
              Phone
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Include a country code outside the US" className="mt-1 h-12 w-full rounded-xl border-0 bg-white px-3 text-[16px] text-[#15202B]" />
            </label>
            <label className="block text-[13px] font-bold">
              Email, if you have it
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-12 w-full rounded-xl border-0 bg-white px-3 text-[16px] text-[#15202B]" />
            </label>
            <label className="block text-[13px] font-bold sm:col-span-2">
              Note for the doctor
              <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why you are sending them" className="mt-1 h-12 w-full rounded-xl border-0 bg-white px-3 text-[16px] text-[#15202B]" />
            </label>
          </div>
          <label className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-white/95">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
            I have their permission to share their name and phone with the doctor I pick.
          </label>
        </section>
        {note ? <p className="mt-3 text-[14px] text-[#5b6773]">{note}</p> : null}
        {choices.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {choices.map((choice) => (
              <button key={choice} type="button" onClick={() => { setWhere(choice); search(choice) }} className="dp-ui min-h-11 rounded-full bg-white px-3 text-[13px] font-extrabold text-[#5C3473]">{choice}</button>
            ))}
          </div>
        ) : null}
        {message ? <p className="mt-3 text-[14px] font-bold text-[#15202B]" role="status">{message}</p> : null}
        <div className="mt-3 space-y-2">
          {doctors.length === 0 ? <EmptyNote title="Doctors show up here" sentence="Search a name, city, state, country, or postal code. NeuroChiro doctors anywhere in the world can come up, nearest first." /> : null}
          {doctors.map((doctor) => (
            <article key={doctor.id} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white px-3 py-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#EFE5F5] dp-ui text-[13px] font-extrabold text-[#5C3473]">{doctor.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="dp-ui block text-[16px] font-extrabold text-[#15202B]">{doctor.name}</span>
                <span className="block text-[13px] text-[#5b6773]">{[doctor.clinic, doctor.place, doctor.miles != null ? `${Math.round(doctor.miles)} mi` : null].filter(Boolean).join(' · ')}</span>
                {doctor.unavailable ? <span className="block text-[13px] text-[#B4501A]">{doctor.unavailable}</span> : null}
              </span>
              {doctor.unavailable ? (
                <Link href={`/doctor/referrals`} className="dp-ui inline-flex min-h-11 items-center rounded-xl border border-[#D7DEE6] px-3 text-[13px] font-extrabold text-[#3d4a57]">View</Link>
              ) : (
                <button type="button" disabled={pending || !consent} onClick={() => send(doctor.id)} className="dp-ui inline-flex min-h-11 items-center rounded-xl bg-[#7A4A94] px-3 text-[13px] font-extrabold text-white disabled:opacity-50">
                  Send warm intro
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
      <aside className="space-y-3">
        <div className="flex gap-1 rounded-2xl bg-white p-1">
          <button type="button" onClick={() => setTab('sent')} className={`dp-ui min-h-11 flex-1 rounded-xl text-[14px] font-extrabold ${tab === 'sent' ? 'bg-[#7A4A94] text-white' : 'text-[#5b6773]'}`}>Sent {sent.length}</button>
          <button type="button" onClick={() => setTab('received')} className={`dp-ui min-h-11 flex-1 rounded-xl text-[14px] font-extrabold ${tab === 'received' ? 'bg-[#7A4A94] text-white' : 'text-[#5b6773]'}`}>Received {received.length}</button>
        </div>
        {rows.length === 0 ? <EmptyNote title={tab === 'sent' ? 'No intros sent' : 'No intros received'} sentence="When you send or receive a referral, it stays in this list." /> : null}
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-[18px] bg-white px-3 py-3">
              <p className="dp-ui text-[15px] font-extrabold text-[#15202B]">{row.title}</p>
              <p className="text-[13px] text-[#5b6773]">{row.detail}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="dp-ui rounded-full bg-[#DCF1EE] px-2 py-1 text-[12px] font-extrabold text-[#0A6159]">{row.status}</span>
                <Link href={row.href} className="dp-ui text-[13px] font-extrabold text-[#5C3473]">Open</Link>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/doctor/referral-network" className="flex items-center justify-between rounded-2xl bg-[#EFE5F5] px-4 py-3 text-[#5C3473]">
          <span>
            <span className="dp-ui block text-[15px] font-extrabold">Your referral network</span>
            <span className="text-[13px]">{trusted} {trusted === 1 ? 'doctor' : 'doctors'} you trust</span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link href="/doctor/referrals" className="dp-ui inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#5C3473]">Full referral history</Link>
      </aside>
    </div>
  )
}
