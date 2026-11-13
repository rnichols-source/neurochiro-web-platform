'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { setOpenToStudents } from '@/app/(doctor)/doctor/network/actions'
import { initialsFrom } from '@/lib/doctor/places'
import type { StudentCard } from '@/lib/doctor/portal-data'
import { EmptyNote } from '@/components/doctor/chrome'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'mentoring', label: 'Mentoring' },
  { id: 'shadowing', label: 'Shadowing' },
  { id: 'associate', label: 'Associate' },
] as const

export function StudentsDesk({ students, open, pro }: { students: StudentCard[]; open: boolean; pro: boolean }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [isOpen, setIsOpen] = useState(open)
  const [pending, start] = useTransition()
  const shown = students.filter((student) => filter === 'all' || student.bucket === filter)

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.7fr]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => {
            const count = item.id === 'all' ? students.length : students.filter((student) => student.bucket === item.id).length
            const on = filter === item.id
            return (
              <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`dp-ui min-h-11 rounded-full px-3 text-[14px] font-extrabold ${on ? 'bg-[#7A4A94] text-white' : 'bg-white text-[#5b6773]'}`}>
                {item.label} {count}
              </button>
            )
          })}
          <label className="ml-auto flex min-h-11 items-center gap-2 rounded-full bg-white px-3 text-[14px] font-bold text-[#15202B]">
            Open to students
            <input
              type="checkbox"
              checked={isOpen}
              disabled={pending || !pro}
              onChange={(event) => {
                const next = event.target.checked
                setIsOpen(next)
                start(async () => {
                  const result = await setOpenToStudents(next)
                  if (!result.ok) setIsOpen(!next)
                })
              }}
            />
          </label>
        </div>
        {!pro ? (
          <div className="mt-3">
            <EmptyNote title="Students are part of Pro" sentence="Activate Pro to invite students to shadow, mentor, or join the practice." />
            <Link prefetch href="/doctor/billing" className="dp-ui mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#7A4A94] px-4 text-[14px] font-extrabold text-white">Activate Pro</Link>
          </div>
        ) : null}
        {pro && shown.length === 0 ? (
          <div className="mt-3">
            <EmptyNote title="No students in this list" sentence="When students join and say what they are looking for, they show up here." />
          </div>
        ) : null}
        <ul className="mt-3 space-y-2">
          {shown.map((student) => (
            <li key={student.id} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white px-3 py-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#EFE5F5] dp-ui text-[13px] font-extrabold text-[#5C3473]">{initialsFrom(student.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="dp-ui block text-[16px] font-extrabold text-[#15202B]">{student.name}</span>
                <span className="block text-[13px] text-[#5b6773]">{[student.school, student.detail].filter(Boolean).join(' · ')}</span>
                <span className="dp-ui mt-1 inline-block rounded-full bg-[#FCEBDF] px-2 py-0.5 text-[12px] font-extrabold text-[#B4501A]">
                  {student.bucket === 'other' ? 'Open to connect' : student.bucket === 'mentoring' ? 'Looking for a mentor' : student.bucket === 'shadowing' ? 'Wants to shadow' : 'Looking for an associate role'}
                </span>
              </span>
              {student.userId ? (
                <Link prefetch href={`/doctor/messages?to=${student.userId}`} className="dp-ui inline-flex min-h-11 items-center rounded-xl bg-[#7A4A94] px-3 text-[13px] font-extrabold text-white">
                  {student.bucket === 'shadowing' ? 'Invite to shadow' : 'Message'}
                </Link>
              ) : (
                <Link prefetch href="/doctor/students" className="dp-ui inline-flex min-h-11 items-center rounded-xl border border-[#D7DEE6] px-3 text-[13px] font-extrabold text-[#3d4a57]">View</Link>
              )}
            </li>
          ))}
        </ul>
        <Link prefetch href="/doctor/students" className="dp-ui mt-3 inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#5C3473]">Browse the full student list</Link>
      </div>
      <aside className="space-y-3">
        <section className="rounded-[22px] bg-[#F8F1E4] p-4">
          <p className="dp-ui text-[18px] font-extrabold text-[#15202B]">ChiroMatch</p>
          <p className="mt-1 text-[14px] leading-snug text-[#5b6773]">Post an associate position and meet graduating students.</p>
          <Link prefetch href="/doctor/coming-soon#chiromatch" className="dp-ui mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-4 text-[14px] font-extrabold text-white">ChiroMatch is coming soon</Link>
        </section>
        <Link prefetch href="/doctor/coming-soon#shadow" className="block rounded-[22px] border border-dashed border-[#E3C27A] bg-white px-4 py-4">
          <p className="dp-ui text-[15px] font-extrabold text-[#15202B]">Shadow requests</p>
          <p className="mt-1 text-[13px] text-[#5b6773]">Students ask to shadow you. The inbox is open if a request is already in.</p>
        </Link>
        <div className="flex flex-col items-start gap-4">
          <Link prefetch href="/doctor/students/shadow" className="dp-ui inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#5C3473]">Open the shadow inbox</Link>
          <Link prefetch href="/doctor/coming-soon#hiring" className="dp-ui inline-flex min-h-11 items-center text-[14px] font-extrabold text-[#5C3473]">Hiring is coming soon</Link>
        </div>
      </aside>
    </div>
  )
}
