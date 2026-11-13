import type { Metadata } from 'next'
import Link from 'next/link'
import { VisitForm } from '@/components/community/visit-form'
import { BackHeading } from '@/components/community/ui'
import { loadCommunitySnapshot, loadListedDoctor, requireCommunityMember } from '@/lib/community/data'
import { homeDoctorCard } from '@/lib/community/logic'

export const metadata: Metadata = { title: 'Request a visit · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function VisitPage({ searchParams }: { searchParams: Promise<{ doctor?: string }> }) {
  const session = await requireCommunityMember()
  const params = await searchParams
  const [snapshot, queried] = await Promise.all([
    loadCommunitySnapshot(session),
    params.doctor ? loadListedDoctor(params.doctor) : Promise.resolve(null),
  ])
  const card = params.doctor
    ? (queried ? homeDoctorCard(queried) : null)
    : (snapshot.homeDoctor?.listed ? snapshot.homeDoctor : null)

  return (
    <div>
      <BackHeading title="Request a visit" href="/portal/care" label="Care" crumb="Care › Request a visit" area="care" />
      {!card ? (
        <p className="text-[13.5px] leading-snug text-[#3d4a57]">
          Choose a listed doctor first. <Link href="/portal/find" className="font-semibold text-[#B4501A]">Find a home doctor</Link>
        </p>
      ) : (
        <>
          <p className="mb-3 text-[13.5px] leading-snug text-[#3d4a57]">
            {card.title}{card.practice ? ` · ${card.practice}` : ''}{card.place ? ` · ${card.place.replace(' · your home doctor', '')}` : ''}
          </p>
          {!snapshot.ready ? (
            <p className="text-[13.5px] text-[#B4501A]">Visit requests save after the latest database update.</p>
          ) : (
            <VisitForm
              doctorId={card.id}
              doctorTitle={card.title}
              people={snapshot.family.map((person) => ({ id: person.id, firstName: person.firstName }))}
              privacy={snapshot.privacy}
              hasEmail={Boolean(session.email)}
            />
          )}
        </>
      )}
    </div>
  )
}
