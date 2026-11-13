import type { Metadata } from 'next'
import { WeekView } from '@/components/community/week-view'
import { requireCommunityMember } from '@/lib/community/data'
import { loadExercises, loadPhaseHome } from '@/lib/community/phase-data'
import { showCountdown, weeklyShowLine } from '@/lib/community/phases'

export const metadata: Metadata = { title: 'This Week · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function WeekPage() {
  const session = await requireCommunityMember()
  const now = new Date()
  const [phase, exercises] = await Promise.all([
    loadPhaseHome(session.userId),
    loadExercises(session.userId),
  ])
  const show = weeklyShowLine(now)
  const primary = exercises.assignments.find((assignment) => !assignment.sample && assignment.status !== 'done') || null
  return (
    <WeekView
      feeling={phase.feeling}
      ready={phase.ready}
      whenLabel={show.tonight ? 'Tonight · 8 PM ET' : show.label}
      countdown={showCountdown(now)}
      reminder={{ assignmentId: primary?.id || null, enabled: Boolean(primary?.reminder) }}
    />
  )
}
