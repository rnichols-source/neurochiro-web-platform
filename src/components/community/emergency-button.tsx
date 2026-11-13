'use client'

import { useState } from 'react'
import { PhoneIcon } from '@/components/community/icons'

export type EmergencyContact = { label: string; phone: string }

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return `tel:${digits}`
}

function ordered(contacts: EmergencyContact[]): EmergencyContact[] {
  return [...contacts].sort((a, b) => Number(b.phone === '911') - Number(a.phone === '911'))
}

function contactLine(contact: EmergencyContact): string {
  return contact.phone === '911' ? '911' : contact.label
}

export function EmergencyButton({ contacts }: { contacts: EmergencyContact[] }) {
  const [open, setOpen] = useState(false)
  const line = ordered(contacts).map(contactLine).join(' · ') || '911 · Poison Control'
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nc-ui inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white py-2 pl-2.5 pr-3 text-left text-[13px] font-extrabold text-[#B3261E] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)]"
      >
        <PhoneIcon />
        <span>
          Emergency
          <small className="block text-[12px] font-bold text-[#7a1d17]">{line}</small>
        </span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-title"
            className="w-full max-w-sm rounded-3xl bg-white p-5 text-[#15202B]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="emergency-title" className="nc-ui text-[20px] font-extrabold text-[#B3261E]">Emergency</h2>
            <p className="mt-1 text-[14px] leading-snug text-[#3d4a57]">Call now. This is not a message to your home doctor.</p>
            <div className="mt-4 flex flex-col gap-2">
              {ordered(contacts).map((contact) => (
                <a key={contact.label} href={telHref(contact.phone)} className="nc-ui flex min-h-11 items-center justify-center rounded-2xl bg-[#B3261E] px-4 text-[16px] font-extrabold text-white">
                  {contact.label} {contact.phone}
                </a>
              ))}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="nc-ui mt-3 min-h-11 w-full rounded-2xl border border-[#e3e0da] text-[15px] font-extrabold text-[#15202B]">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function EmergencyBar({ contacts }: { contacts: EmergencyContact[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-[#FDECEA] px-3.5 py-3 text-[13px] text-[#B3261E]">
      <PhoneIcon />
      <span className="nc-ui font-extrabold">Emergency</span>
      {ordered(contacts).map((contact) => (
        <a key={contact.label} href={telHref(contact.phone)} className="nc-ui inline-flex min-h-11 items-center font-extrabold underline-offset-2 hover:underline">
          {contact.phone === '911' ? '911' : `${contact.label} ${contact.phone}`}
        </a>
      ))}
    </div>
  )
}
