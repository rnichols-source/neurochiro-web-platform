import { PlaceHeader } from '@/components/founder/header'
import { ToolLinks } from '@/components/founder/bits'
import { PeopleBoard } from '@/components/founder/people-board'
import { doctorRows, memberRows, studentRows } from '@/lib/founder/model'
import { PEOPLE_TOOLS } from '@/lib/founder/places'
import { loadFounderRoster } from '@/lib/founder/roster'

export const dynamic = 'force-dynamic'

const TABS = ['doctors', 'applications', 'members', 'subscribers', 'students'] as const

export default async function PeoplePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const tab = typeof params.tab === 'string' && TABS.includes(params.tab as typeof TABS[number]) ? params.tab as typeof TABS[number] : 'doctors'
  const id = typeof params.id === 'string' ? params.id : ''
  const filter = typeof params.filter === 'string' ? params.filter : 'all'
  const roster = await loadFounderRoster()
  const doctors = doctorRows(roster)
  const members = memberRows(roster)
  const students = studentRows(roster)

  return (
    <div>
      <PlaceHeader place="people" title="People" subtitle="Everyone on NeuroChiro, in one searchable list." />
      <PeopleBoard
        doctors={doctors}
        applications={roster.applications}
        members={members}
        subscribers={roster.subscribers}
        students={students}
        initialTab={tab}
        initialId={id}
        initialFilter={filter}
      />
      <div className="px-4 pb-6 lg:px-8"><ToolLinks links={PEOPLE_TOOLS} /></div>
    </div>
  )
}
