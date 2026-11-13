import type { Metadata } from 'next'
import Link from 'next/link'
import { LiveQuestionForm } from '@/components/community/live-question-form'
import { WeekCheckIn } from '@/components/community/week-check-in'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { loadPhaseHome, loadUpcomingLives } from '@/lib/community/phase-data'

export const metadata: Metadata = { title: 'This week · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function WeekPage() {
  const session = await requireCommunityMember()
  const [phase, lives] = await Promise.all([
    loadPhaseHome(session.userId),
    loadUpcomingLives(),
  ])

  return (
    <div>
      <BackHeading title="This week" />
      <p className="mb-4 text-[13.5px] leading-snug text-[#3d4a57]">A short check-in, the show, and what is coming up. It is not a chart.</p>
      <Card>
        <Kicker>Check-in</Kicker>
        <p className="mb-2 font-heading text-[16px] font-bold text-neuro-navy">How is your family’s nervous system this week?</p>
        {phase.ready ? <WeekCheckIn initial={phase.feeling} /> : <p className="text-[13.5px] text-[#3d4a57]">The check-in saves with the latest database update.</p>}
      </Card>
      {phase.reminderTitle ? (
        <Card>
          <Kicker>A quiet reminder</Kicker>
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">{phase.reminderTitle}</p>
          <Link href="/portal/care/exercises" className="mt-2 inline-block text-[13px] font-semibold text-[#B4501A]">Open the set →</Link>
        </Card>
      ) : (
        <Card>
          <Kicker>Exercises and remedies</Kicker>
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">Your home doctor can assign a set. NeuroChiro does not keep a library of stretches or remedies, and a set is not a visit.</p>
          <Link href="/portal/care/exercises" className="mt-2 inline-block text-[13px] font-semibold text-[#B4501A]">Open sets →</Link>
        </Card>
      )}
      <Card>
        <Kicker>Sit in</Kicker>
        <ul className="space-y-3">
          {lives.map((event) => (
            <li key={`${event.title}-${event.when}`}>
              <a href={event.href} className="block">
                <p className="font-heading text-[15px] font-bold text-neuro-navy">{event.title}</p>
                <p className="text-[12.5px] text-[#3d4a57]">{event.when}{event.place ? ` · ${event.place}` : ''}</p>
              </a>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <Kicker>A question for the show</Kicker>
        <LiveQuestionForm />
      </Card>
    </div>
  )
}
