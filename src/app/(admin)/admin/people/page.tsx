import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { AdminRouteSkeleton } from '@/components/loading/route-skeletons'
import { ToolLinks } from '@/components/founder/bits'
import { CouldNotLoad } from '@/components/founder/load-error'
import { PeopleBoard } from '@/components/founder/people-board'
import { doctorRows, memberRows, studentRows } from '@/lib/founder/model'
import { PEOPLE_TOOLS } from '@/lib/founder/places'
import { loadFounderRoster } from '@/lib/founder/roster'
import { requireAdminPage } from '@/lib/founder/guard'

export const dynamic = 'force-dynamic'

const TABS = ['doctors', 'applications', 'members', 'subscribers', 'students'] as const

export default async function PeoplePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPage()
  const params = await searchParams
  const tab = typeof params.tab === 'string' && TABS.includes(params.tab as typeof TABS[number]) ? params.tab as typeof TABS[number] : 'doctors'
  const id = typeof params.id === 'string' ? params.id : ''
  const filter = typeof params.filter === 'string' ? params.filter : 'live'
  return (
    <div>
      <PlaceHeader place="people" title="People" subtitle="Everyone on NeuroChiro, in one searchable list." />
      <Suspense fallback={<AdminRouteSkeleton />}>
        <PeopleBody tab={tab} id={id} filter={filter} />
      </Suspense>
    </div>
  )
}

async function PeopleBody({ tab, id, filter }: { tab: typeof TABS[number]; id: string; filter: string }) {
  let roster
  try {
    roster = await loadFounderRoster()
  } catch {
    return <CouldNotLoad what="People" />
  }
  const doctors = doctorRows(roster)
  const members = memberRows(roster)
  const students = studentRows(roster)
  const people = new Map(roster.people.map((person) => [person.id, person]))
  const applications = roster.applications.map((row) => ({
    ...row,
    displayName: (row.userId && people.get(row.userId)?.name) || 'Doctor application',
  }))

  return (
    <>
      <PeopleBoard
        doctors={doctors}
        applications={applications}
        members={members}
        subscribers={roster.subscribers}
        students={students}
        initialTab={tab}
        initialId={id}
        initialFilter={filter}
        paidKnown={roster.paidKnown}
        remindersKnown={roster.remindersKnown}
      />
      <div className="px-4 pb-6 lg:px-8"><ToolLinks links={PEOPLE_TOOLS} /></div>
    </>
  )
}
