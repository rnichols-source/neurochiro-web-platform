'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { dismissGettingStarted } from '@/app/(doctor)/doctor/home-actions'

const STEPS = [
  { href: '/doctor/profile', title: 'Complete your profile', detail: 'Photo, bio, city, and hours. People read this on neurochiro.co before they request you.' },
  { href: '/doctor/profile#instagram', title: 'Add Instagram', detail: 'The link goes on your public profile.' },
  { href: '/doctor/people', title: 'How requests work', detail: 'A request lands in People. Tap the name for phone, email, and the next stage.' },
  { href: '/doctor/care-sets', title: 'How to send a home plan', detail: 'Open a person, tap Send a home plan, then tap the plan. Follow-through is on Home plans.' },
]

export function GettingStarted({
  profileDone,
  instagramDone,
}: {
  profileDone: boolean
  instagramDone: boolean
}) {
  const [hidden, setHidden] = useState(false)
  const [pending, start] = useTransition()
  if (hidden) return null
  const marks = [profileDone, instagramDone, false, false]
  return (
    <section className="mb-4 rounded-[22px] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="dp-ui text-[18px] font-extrabold text-[#15202B]">Getting started</h2>
          <p className="mt-1 text-[14px] text-[#5b6773]">Four things that make the portal make sense.</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => {
            await dismissGettingStarted()
            setHidden(true)
          })}
          className="dp-ui min-h-11 px-3 text-[14px] font-extrabold text-[#5b6773]"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {STEPS.map((step, index) => (
          <li key={step.href}>
            <Link href={step.href} className="block rounded-2xl bg-[#F5F3EF] px-3 py-3">
              <span className="dp-ui block text-[15px] font-extrabold text-[#15202B]">{marks[index] ? 'Done · ' : ''}{step.title}</span>
              <span className="mt-1 block text-[13px] text-[#5b6773]">{step.detail}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
