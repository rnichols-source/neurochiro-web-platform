import { redirect } from 'next/navigation'
import { DoctorBand } from '@/components/doctor/chrome'
import { PeopleDesk } from '@/components/doctor/people-desk'
import { getPortalContext } from '@/lib/portal/context'
import { loadPeople } from '@/lib/doctor/portal-data'
import { loadDoctorPlanChoices, loadFollowThrough } from '@/lib/doctor/follow-data'
import { libraryPlans, remedyGuide } from '@/lib/community/library-content'
import { remedyChoices } from '@/lib/community/library-model'
import { defaultTimesPerWeek } from '@/lib/doctor/follow-through'
import { getDoctorTimezone } from '@/lib/doctor-timezone'

export const dynamic = 'force-dynamic'

export default async function PeoplePage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (!ctx.doctor?.id) {
    return (
      <div>
        <DoctorBand place="people" title="People" subtitle="People who ask to see you show up here." />
        <p className="mt-4 text-[15px] text-[#5b6773]">A doctor profile is required before people can land here.</p>
      </div>
    )
  }
  const timeZone = getDoctorTimezone(ctx.doctor.state, ctx.doctor.country, 'America/New_York') || 'America/New_York'
  const [data, choices, follow] = await Promise.all([
    loadPeople(ctx.doctor.id, timeZone),
    loadDoctorPlanChoices(ctx.doctor.id),
    loadFollowThrough(ctx.doctor.id, new Date(), timeZone),
  ])
  const plans = libraryPlans().map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    timesPerWeek: defaultTimesPerWeek(plan.phases[0]?.frequency),
  }))
  const remedies = remedyChoices(remedyGuide())
  const nowIso = new Date().toISOString()
  return (
    <div>
      <DoctorBand place="people" title="People" subtitle="Open a name, call them, then move the stage. Send a home plan in one tap." />
      <PeopleDesk people={data.people} ready={data.ready} timeZone={timeZone} plans={plans} customSets={choices.customSets} remedies={remedies} followRows={follow.rows} nowIso={nowIso} />
    </div>
  )
}
