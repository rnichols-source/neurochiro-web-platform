import type { Metadata } from 'next'
import Link from 'next/link'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'
import { LIBRARY_COPY } from '@/lib/community/library-model'
import { loadPhaseHome } from '@/lib/community/phase-data'

export const metadata: Metadata = { title: 'Your care · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function CarePage() {
  const session = await requireCommunityMember()
  const [snapshot, phase] = await Promise.all([
    loadCommunitySnapshot(session),
    loadPhaseHome(session.userId),
  ])
  const doctor = snapshot.homeDoctor
  return (
    <div>
      <BackHeading title="Your care" />
      <Card>
        <Kicker>Home doctor</Kicker>
        {doctor ? (
          <>
            <h2 className="font-heading text-[16px] font-bold text-neuro-navy">{doctor.title}</h2>
            <p className="mt-1 text-[13.5px] leading-snug text-[#3d4a57]">
              {doctor.practice ? <>{doctor.practice}<br /></> : null}
              {doctor.place}
            </p>
            <div className="mt-3 flex gap-3 text-[13px] font-semibold text-[#B4501A]">
              {doctor.listed ? <Link href={`/portal/visit?doctor=${doctor.id}`}>Request a visit</Link> : null}
              <Link href="/portal/find">Change</Link>
              {doctor.profileHref ? <Link href={doctor.profileHref}>Profile</Link> : null}
            </div>
          </>
        ) : (
          <>
            <p className="text-[13.5px] leading-snug text-[#3d4a57]">You do not have a home doctor yet.</p>
            <Link href="/portal/find" className="mt-2 inline-block text-[13px] font-semibold text-[#B4501A]">Find one in the directory →</Link>
          </>
        )}
      </Card>
      <Card>
        <Kicker>Household</Kicker>
        <p className="text-[13.5px] leading-snug text-[#3d4a57]">
          {snapshot.family.length === 0
            ? 'Just you, for now.'
            : snapshot.family.map((person) => person.firstName).join(', ')}
        </p>
        <Link href="/portal/family" className="mt-2 inline-block text-[13px] font-semibold text-[#B4501A]">Edit household →</Link>
      </Card>
      <Card>
        <Kicker>Visit requests</Kicker>
        {snapshot.requests.length === 0 ? (
          <p className="text-[13.5px] text-[#3d4a57]">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {snapshot.requests.slice(0, 5).map((request) => (
              <li key={request.id} className="text-[13.5px] text-[#3d4a57]">
                <span className="font-semibold text-neuro-navy">{request.doctorTitle || 'Doctor'}</span>
                {' · '}{request.status}
                {request.sharedFirstName ? '' : ' · name not shared'}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <Kicker>Send someone you love</Kicker>
        <p className="text-[13.5px] leading-snug text-[#3d4a57]">A private link for a friend or family member, in this city or another country.</p>
        <Link href="/portal/care/invite" className="mt-2 inline-block text-[13px] font-semibold text-[#B4501A]">Open →</Link>
      </Card>
      <Card>
        <Kicker>Exercises and remedies</Kicker>
        <p className="text-[13.5px] leading-snug text-[#3d4a57]">{phase.careLine || LIBRARY_COPY.careCard}</p>
        <div className="mt-2 flex gap-3 text-[13px] font-semibold text-[#B4501A]">
          <Link href="/portal/care/exercises">Exercises</Link>
          <Link href="/portal/care/remedies">Remedies</Link>
        </div>
      </Card>
      <div id="message" className="rounded-2xl bg-[#fdf1ea] px-3.5 py-3">
        <strong className="mb-1 block font-heading text-[13px] font-bold text-neuro-navy">Message</strong>
        <p className="text-[12.5px] leading-snug text-[#3d4a57]">Messages with your home doctor are not open yet. A visit request is how you reach the office, and they only receive what you check.</p>
      </div>
    </div>
  )
}
