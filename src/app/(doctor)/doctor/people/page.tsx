import { redirect } from 'next/navigation'
import { DoctorBand } from '@/components/doctor/chrome'
import { PeopleDesk } from '@/components/doctor/people-desk'
import { ToolChips } from '@/components/doctor/tool-chips'
import { getPortalContext } from '@/lib/portal/context'
import { loadPeople } from '@/lib/doctor/portal-data'

export const dynamic = 'force-dynamic'

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (!ctx.doctor?.id) {
    return (
      <div>
        <DoctorBand place="people" title="People" subtitle="Community members who chose you, and people coming your way." />
        <ToolChips group="people" />
        <p className="mt-4 text-[15px] text-[#5b6773]">A doctor profile is required before people can land here.</p>
      </div>
    )
  }
  const filter = (await searchParams).filter
  const data = await loadPeople(ctx.doctor.id)
  return (
    <div>
      <DoctorBand place="people" title="People" subtitle="Directory requests, referrals, care sets, and messages, in one list." />
      <ToolChips group="people" />
      <PeopleDesk people={data.people} ready={data.ready} initialFilter={filter} />
    </div>
  )
}
