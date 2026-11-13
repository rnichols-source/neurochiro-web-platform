import type { Metadata } from 'next'
import Link from 'next/link'
import { IntroForm } from '@/components/community/intro-form'
import { CloseTrip, TripForm } from '@/components/community/trip-form'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'
import { displayFirstName } from '@/lib/community/logic'
import { findDoctorsForPlace, loadSharedExerciseTitles, loadTrips } from '@/lib/community/phase-data'
import { TRIP_KIND_LABELS, type ParsedPlace } from '@/lib/community/phases'

export const metadata: Metadata = { title: 'Your passport · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function PassportPage() {
  const session = await requireCommunityMember()
  const [snapshot, trips, titles] = await Promise.all([
    loadCommunitySnapshot(session),
    loadTrips(session.userId),
    loadSharedExerciseTitles(session.userId),
  ])
  const upcoming = trips.trips.find((trip) => trip.status === 'upcoming') || null
  const place: ParsedPlace | null = upcoming ? {
    label: upcoming.place,
    city: upcoming.city,
    stateCode: upcoming.stateCode,
    countryCode: upcoming.countryCode,
    scope: upcoming.city ? 'city' : upcoming.stateCode ? 'state' : 'country',
  } : null
  const nearby = place ? await findDoctorsForPlace(place) : { doctors: [], widened: null }
  const home = snapshot.homeDoctor
  const homeSentence = home
    ? `Your home doctor is ${home.title}${home.place ? ` in ${home.place.replace(' · your home doctor', '')}` : ''}. When you’re away, your care can travel with you.`
    : 'When you travel, move, or want a second look, your membership can go with you.'

  return (
    <div>
      <BackHeading title="I’m traveling" href="/portal/refer" label="Find & Refer" crumb="Find & Refer › I’m traveling" area="refer" />
      <p className="mb-4 text-[13.5px] leading-snug text-[#3d4a57]">{homeSentence}</p>
      {!trips.ready ? (
        <Card>
          <Kicker>Almost ready</Kicker>
          <p className="text-[13.5px] text-[#3d4a57]">A passport saves with the latest database update.</p>
        </Card>
      ) : null}
      {upcoming ? (
        <section className="mb-[11px] rounded-[18px] bg-[#15202B] px-4 py-4 text-white">
          <p className="text-[12px] font-semibold text-white/70">{TRIP_KIND_LABELS[upcoming.kind]}</p>
          <h2 className="mt-1 font-heading text-[22px] font-bold tracking-[-0.03em]">{upcoming.place}</h2>
          <p className="mt-1 text-[14px] text-white/80">{upcoming.when}</p>
          <div className="mt-3">
            <CloseTrip tripId={upcoming.id} light />
          </div>
        </section>
      ) : trips.ready ? (
        <Card>
          <Kicker>Where you’re going</Kicker>
          <TripForm />
        </Card>
      ) : null}
      {upcoming ? (
        <Card>
          <Kicker>Nervous system chiropractors near your stay</Kicker>
          {nearby.widened ? <p className="mb-2 text-[12.5px] text-[#6b7785]">None were listed in that exact place. These are listed nearby.</p> : null}
          {nearby.doctors.length === 0 ? (
            <p className="text-[13.5px] text-[#3d4a57]">No listed doctor is in that place yet.</p>
          ) : (
            <ul className="divide-y divide-[#eee]">
              {nearby.doctors.map((doctor) => (
                <li key={doctor.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8eef3] font-heading text-[14px] font-bold text-neuro-navy">{doctor.initials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[15px] font-bold text-neuro-navy">{doctor.title}</p>
                    <p className="text-[12px] text-[#6b7785]">{[doctor.city, doctor.state].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Link href={`/portal/visit?doctor=${doctor.id}`} className="text-[13px] font-semibold text-[#B4501A]">Request</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
      {upcoming && nearby.doctors.length > 0 ? (
        <Card>
          <Kicker>A warm introduction</Kicker>
          <p className="mb-3 text-[13px] leading-snug text-[#3d4a57]">They start mid-conversation, with only what you check. This is not a chart.</p>
          <IntroForm
            tripId={upcoming.id}
            doctors={nearby.doctors.map((doctor) => ({ id: doctor.id, title: doctor.title }))}
            hasName={Boolean(displayFirstName(session.fullName))}
            hasHome={Boolean(home)}
            hasFamily={snapshot.family.length > 0}
            hasSharedSets={titles.length > 0}
            defaults={{
              name: snapshot.privacy.shareNameWithHomeDoctor,
              clinic: snapshot.privacy.shareHomeClinicWithOtherDoctors,
            }}
          />
          {titles.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-[#6b7785]">Set titles travel only after you allow it on each set.</p>
          ) : null}
        </Card>
      ) : null}
      <Link href="/portal/privacy" className="block rounded-2xl bg-[#fdf1ea] px-3.5 py-3">
        <strong className="mb-1 block font-heading text-[13px] font-bold text-neuro-navy">You’re in control of what’s shared</strong>
        <p className="text-[12.5px] leading-snug text-[#3d4a57]">A doctor only sees what you choose on the introduction. Nothing else goes over until you say so.</p>
      </Link>
    </div>
  )
}
