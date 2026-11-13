'use client'

import { useState } from 'react'
import { previewBroadcastAction, sendBroadcastAction } from '@/app/(admin)/admin/founder-actions'
import type { Channel } from '@/lib/founder/audience'

const AUDIENCES: { id: string; label: string }[] = [
  { id: 'doctors', label: 'Doctors' },
  { id: 'members', label: 'Community members' },
  { id: 'students', label: 'Students' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'everyone', label: 'Everyone' },
  { id: 'founding', label: 'Founding members' },
  { id: 'ignoring', label: 'Ignoring requests 48h+' },
  { id: 'stalled', label: 'Stalled applications' },
  { id: 'unconfirmed', label: 'Subscribers who never confirmed' },
]

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'banner', label: 'Banner' },
  { id: 'email', label: 'Email' },
  { id: 'inapp', label: 'In-app' },
  { id: 'text', label: 'Text (Quo)' },
]

export function BroadcastForm({ presets, initialAudience = 'founding' }: { presets: { id: string; count: number; label: string }[]; initialAudience?: string }) {
  const [audience, setAudience] = useState(initialAudience)
  const [channels, setChannels] = useState<Channel[]>(['email'])
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [subject, setSubject] = useState('Your founding rate ends Dec 1')
  const [body, setBody] = useState('Here is what changes and what stays the same for you.')
  const [href, setHref] = useState('https://neurochiro.co/doctor')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [when, setWhen] = useState('')
  const [preview, setPreview] = useState<{ count: number; names: string[] } | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function toggle(channel: Channel) {
    setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])
    setPreview(null)
  }

  async function previewNow() {
    setBusy(true)
    setMessage('')
    const result = await previewBroadcastAction({ audience, state, country, channels })
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message || 'Could not count that audience.')
      setPreview(null)
      return
    }
    setPreview({ count: result.count, names: result.names })
  }

  async function send(schedule: boolean) {
    if (!preview) return
    const whenText = schedule && when ? `Schedule this for ${when}` : 'Send this now'
    if (!window.confirm(`${whenText} to ${preview.count} people?\n\nChannels: ${channels.join(', ')}\n\nNothing goes out until you confirm.`)) return
    setBusy(true)
    const result = await sendBroadcastAction({
      audience,
      state,
      country,
      channels,
      subject,
      body,
      href,
      startsAt,
      endsAt,
      expected: preview.count,
      scheduledFor: schedule ? new Date(when).toISOString() : '',
    })
    setBusy(false)
    setMessage(result.message)
    if (result.ok) setPreview(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <section className="rounded-[22px] bg-white p-5">
        <Step n={1} title="Who" />
        <div className="mt-2 flex flex-wrap gap-2">
          {AUDIENCES.map((item) => (
            <button key={item.id} type="button" onClick={() => { setAudience(item.id); setPreview(null) }} className={`fd-ui min-h-11 rounded-[13px] border-2 px-3 text-[14px] font-extrabold ${audience === item.id ? 'border-[#7A4A94] bg-[#7A4A94] text-white' : 'border-[#E3D6EB] text-[#5C3473]'}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={state} onChange={(event) => { setState(event.target.value); setPreview(null) }} placeholder="State code" className="min-h-11 w-28 rounded-full bg-[#EFE5F5] px-3 text-[13px] font-bold text-[#5C3473] outline-none" />
          <input value={country} onChange={(event) => { setCountry(event.target.value); setPreview(null) }} placeholder="Country code" className="min-h-11 w-32 rounded-full bg-[#EFE5F5] px-3 text-[13px] font-bold text-[#5C3473] outline-none" />
        </div>
        <Step n={2} title="How" />
        <div className="mt-2 flex flex-wrap gap-2">
          {CHANNELS.map((item) => (
            <button key={item.id} type="button" onClick={() => toggle(item.id)} className={`fd-ui min-h-11 rounded-[13px] border-2 px-3 text-[14px] font-extrabold ${channels.includes(item.id) ? 'border-[#7A4A94] bg-[#7A4A94] text-white' : 'border-[#E3D6EB] text-[#5C3473]'}`}>
              {item.label}
            </button>
          ))}
        </div>
        <Step n={3} title="Say it" />
        <input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border-2 border-[#E3D6EB] px-3 fd-ui font-extrabold outline-none" />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border-2 border-[#E3D6EB] px-3 py-2 text-[15px] outline-none" />
        {channels.includes('banner') ? (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input value={href} onChange={(event) => setHref(event.target.value)} placeholder="Link" className="min-h-11 rounded-xl border border-[#E3D6EB] px-3 text-[14px]" />
            <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="min-h-11 rounded-xl border border-[#E3D6EB] px-3 text-[14px]" />
            <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="min-h-11 rounded-xl border border-[#E3D6EB] px-3 text-[14px]" />
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} onClick={previewNow} className="fd-ui min-h-12 rounded-2xl bg-[#F5F3EF] px-4 font-extrabold text-[#5C3473]">Count recipients</button>
          {preview ? <p className="fd-ui text-[32px] font-extrabold text-[#7A4A94]">{preview.count} <span className="text-[13px] font-bold text-[#4a5865]">people</span></p> : null}
        </div>
        {preview ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className="min-h-12 rounded-xl border border-[#E3D6EB] px-3" />
            <button type="button" disabled={busy || !when} onClick={() => send(true)} className="fd-ui min-h-12 rounded-2xl border-2 border-[#E3D6EB] px-4 font-extrabold">Schedule</button>
            <button type="button" disabled={busy} onClick={() => send(false)} className="fd-ui min-h-12 rounded-2xl bg-[#7A4A94] px-5 font-extrabold text-white">Send to {preview.count}</button>
          </div>
        ) : null}
        {preview?.names.length ? <p className="mt-2 text-[13px] text-[#6b7785]">Includes {preview.names.join(', ')}{preview.count > preview.names.length ? '…' : ''}</p> : null}
        {message ? <p className="mt-3 text-[14px] text-[#3d4a57]">{message}</p> : null}
        <p className="mt-4 text-[13px] text-[#6b7785]">Nothing is sent until you confirm the count. Text only goes to numbers that already opted in. Doctor-portal banners are saved here; the doctor home is being rebuilt separately, so a doctor banner may not show there yet. Community-member banners show on their home.</p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="fd-ui text-[16px] font-extrabold">Ready-made audiences</h3>
            <span className="text-[12px] text-[#8a95a1]">one tap fills Who</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((preset) => (
              <button key={preset.id} type="button" onClick={() => { setAudience(preset.id); setPreview(null) }} className="rounded-2xl bg-[#EFE5F5] p-3 text-left">
                <b className="fd-ui block text-[22px] text-[#5C3473]">{preset.count}</b>
                <span className="text-[13px] text-[#4a5865]">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <aside className="rounded-[22px] bg-white p-5">
        <h2 className="fd-ui text-[16px] font-extrabold">Banner preview</h2>
        <p className="text-[12px] text-[#8a95a1]">What a banner looks like</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#E6E2DB] bg-[#F5F3EF]">
          <div className="flex items-center gap-2 bg-[#7A4A94] px-3 py-3 text-[13px] text-white">
            <span className="flex-1"><b>{subject || 'Banner title'}</b> {body}</span>
            <span>×</span>
          </div>
          <div className="space-y-2 p-4">
            <div className="h-3 rounded-full bg-[#E6E2DB]" />
            <div className="h-3 w-2/3 rounded-full bg-[#E6E2DB]" />
          </div>
        </div>
      </aside>
    </div>
  )
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#7A4A94] fd-ui text-[13px] font-extrabold text-white">{n}</span>
      <h2 className="fd-ui text-[17px] font-extrabold">{title}</h2>
    </div>
  )
}
