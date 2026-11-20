import { redirect } from 'next/navigation'
import { DoctorBand } from '@/components/doctor/chrome'
import { PeopleDesk } from '@/components/doctor/people-desk'
import { ToolChips } from '@/components/doctor/tool-chips'
import { getPortalContext } from '@/lib/portal/context'
import { loadPeople } from '@/lib/doctor/portal-data'
import { loadDoctorPlanChoices } from '@/lib/doctor/follow-data'
import { libraryPlans } from '@/lib/community/library-content'
import { getDoctorTimezone } from '@/lib/doctor-timezone'

export const dynamic = 'force-dynamic'

export default async function PeoplePage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (!ctx.doctor?.id) {
    return (
      <div>
        <DoctorBand place="people" title="People" subtitle="Patients who ask to see you show up here." />
        <ToolChips group="people" />
        <p className="mt-4 text-[15px] text-[#5b6773]">A doctor profile is required before people can land here.</p>
      </div>
    )
  }
  const timeZone = getDoctorTimezone(ctx.doctor.state, ctx.doctor.country, 'America/New_York') || 'America/New_York'
  const [data, choices] = await Promise.all([
    loadPeople(ctx.doctor.id, timeZone),
    loadDoctorPlanChoices(ctx.doctor.id),
  ])
  const plans = libraryPlans().map((plan) => ({ slug: plan.slug, name: plan.name }))
  return (
    <div>
      <DoctorBand place="people" title="People" subtitle="Patient requests, with phone, email, and the next step." />
      <ToolChips group="people" />
      <PeopleDesk people={data.people} ready={data.ready} timeZone={timeZone} plans={plans} customSets={choices.customSets} />
    </div>
  )
}
