import type { Metadata } from 'next'
import Link from 'next/link'
import { CloseInterest, WorkForm } from '@/components/community/work-form'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { loadOpenings, loadWorkInterests } from '@/lib/community/phase-data'
import { WORK_PATH_LABELS, parsePlace } from '@/lib/community/phases'

export const metadata: Metadata = { title: 'Work · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function WorkPage() {
  const session = await requireCommunityMember()
  const work = await loadWorkInterests(session.userId)
  const open = work.interests.find((interest) => interest.status !== 'closed') || null
  const parsed = open ? parsePlace(open.place) : null
  const place = parsed && !('error' in parsed) ? parsed : null
  const openings = open ? await loadOpenings(open.path, place) : []

  return (
    <div>
      <BackHeading title="Work in this field" href="/portal/me" label="Me" crumb="Me › Work" area="me" />
      <p className="mb-4 text-[13.5px] leading-snug text-[#3d4a57]">Raise a hand for CA, front desk, or a student path. Offices in the community can see that interest and connect. This is not a job board profile.</p>
      {!work.ready ? (
        <Card>
          <Kicker>Almost ready</Kicker>
          <p className="text-[13.5px] text-[#3d4a57]">This saves with the latest database update.</p>
        </Card>
      ) : <WorkForm />}
      {work.interests.length > 0 ? (
        <Card>
          <Kicker>Your hand</Kicker>
          <ul className="space-y-3">
            {work.interests.map((interest) => (
              <li key={interest.id} className="text-[13.5px] text-[#3d4a57]">
                <p className="font-semibold text-neuro-navy">{WORK_PATH_LABELS[interest.path]} · {interest.place}</p>
                <p>{interest.status === 'connected' ? 'An office reached out' : interest.status === 'closed' ? 'Closed' : 'Open'}</p>
                {interest.note ? <p className="mt-1">{interest.note}</p> : null}
                {interest.status !== 'closed' ? <div className="mt-1"><CloseInterest id={interest.id} /></div> : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {open ? (
        <Card>
          <Kicker>Offices hiring for this path</Kicker>
          {openings.length === 0 ? (
            <p className="text-[13.5px] text-[#3d4a57]">No matching opening is posted right now. Your raised hand is still visible to member offices near {open.place}.</p>
          ) : (
            <ul className="space-y-3">
              {openings.map((opening) => (
                <li key={opening.id}>
                  <Link href={opening.href} className="block">
                    <p className="font-heading text-[15px] font-bold text-neuro-navy">{opening.title}</p>
                    <p className="text-[12.5px] text-[#3d4a57]">{[opening.clinic, opening.place].filter(Boolean).join(' · ')}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
      <div className="rounded-2xl bg-[#fdf1ea] px-3.5 py-3">
        <p className="font-heading text-[13px] font-bold text-neuro-navy">Student membership is separate</p>
        <p className="mt-1 text-[12.5px] leading-snug text-[#3d4a57]">Raising a hand does not turn this account into a student or a doctor. A student path has its own application.</p>
        <Link href="/register?role=student" className="mt-2 inline-block text-[13px] font-semibold text-[#B4501A]">Look at the student account →</Link>
      </div>
    </div>
  )
}
