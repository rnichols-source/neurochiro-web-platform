'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { canUseNextImage } from '@/lib/quiz/photo'
import type { MatchSuccess, QuizMatch } from '@/lib/quiz/match'
import type { PriorityId } from '@/lib/quiz/options'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange focus-visible:ring-offset-2'

function initials(name: string): string {
  const parts = name.replace(/^Dr\.\s*/i, '').split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function DoctorCard({
  doctor,
  priority,
  onRequest,
}: {
  doctor: QuizMatch
  priority: PriorityId
  onRequest: (doctor: QuizMatch) => void
}) {
  const place = [doctor.city, doctor.region].filter(Boolean).join(', ')
  const photo = doctor.photoUrl && canUseNextImage(doctor.photoUrl)
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex gap-3">
        {doctor.photoUrl ? (
          photo ? (
            <Image src={doctor.photoUrl} alt={doctor.name} width={64} height={64} className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <>
              {/* Hosts outside next.config stay on a plain image so the card still shows a photo. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doctor.photoUrl} alt={doctor.name} width={64} height={64} loading="lazy" className="h-16 w-16 rounded-2xl object-cover" />
            </>
          )
        ) : (
          <div aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neuro-cream text-base font-semibold text-neuro-navy">
            {initials(doctor.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg text-neuro-navy">{doctor.name}</h2>
          {doctor.clinic ? <p className="text-sm text-gray-600">{doctor.clinic}</p> : null}
          <p className="text-sm text-neuro-navy">
            {[place, doctor.awayLabel].filter(Boolean).join(' · ')}
          </p>
          {doctor.verified ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-neuro-navy">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-neuro-orange-ink" /> Verified
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {doctor.accepting ? <span className="rounded-full bg-neuro-cream px-2 py-1 text-sm text-neuro-navy">Taking new patients</span> : null}
        {doctor.walkIns && priority === 'walk_in' ? <span className="rounded-full bg-neuro-cream px-2 py-1 text-sm text-neuro-navy">Walk-ins welcome</span> : null}
        {doctor.offer?.title ? <span className="rounded-full bg-neuro-orange-ink/10 px-2 py-1 text-sm text-neuro-orange-ink">New patient offer</span> : null}
        {doctor.specialties.map((item) => (
          <span key={item} className="rounded-full bg-white px-2 py-1 text-sm text-neuro-navy ring-1 ring-gray-200">{item}</span>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={() => onRequest(doctor)} className={`min-h-11 w-full rounded-xl bg-neuro-orange-ink px-4 text-base font-semibold text-white ${focusRing}`}>
          Request an appointment
        </button>
        <Link href={`/directory/${doctor.slug}?from=quiz`} className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-4 text-base font-semibold text-neuro-navy ${focusRing}`}>
          View profile
        </Link>
      </div>
    </article>
  )
}

export function ResultsView({
  data,
  showAll,
  onShowAll,
  onRequest,
  children,
}: {
  data: MatchSuccess
  showAll: boolean
  onShowAll: () => void
  onRequest: (doctor: QuizMatch) => void
  children?: React.ReactNode
}) {
  const visible = showAll ? data.matches : data.matches.slice(0, 3)
  return (
    <div>
      <p className="mt-2 text-base text-neuro-navy">{data.headline}</p>
      {data.noLocal ? (
        <p className="mt-2 text-sm text-gray-600">Want a note when a NeuroChiro doctor joins near {data.place}? You can add alerts below. We&apos;ll ask you to confirm by email first.</p>
      ) : null}
      {data.empty ? (
        <div className="mt-6 space-y-4">
          <Link href="/directory" className={`inline-flex min-h-11 items-center text-base font-semibold text-neuro-orange-ink underline ${focusRing}`}>Browse the directory</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {visible.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} priority={data.priority} onRequest={onRequest} />
          ))}
          {data.matches.length > 3 && !showAll ? (
            <button type="button" onClick={onShowAll} className={`min-h-11 w-full rounded-xl border border-gray-300 px-4 text-base font-semibold text-neuro-navy ${focusRing}`}>
              Show 3 more
            </button>
          ) : null}
          <Link href={data.directoryHref} className={`inline-flex min-h-11 items-center text-base font-semibold text-neuro-orange-ink underline ${focusRing}`}>
            {data.directoryLabel}
          </Link>
        </div>
      )}
      {children}
    </div>
  )
}
