import type { Metadata } from 'next'
import { HomeScreen } from '@/components/community/home-screen'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'
import { countDone } from '@/lib/community/library-model'
import { memberInitial } from '@/lib/community/logic'
import { loadExercises, loadPhaseHome } from '@/lib/community/phase-data'
import { firstOpenPhase, splitPhaseName, todayFocus, type TodayPlan } from '@/lib/community/today'

export const metadata: Metadata = { title: 'Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function CommunityHomePage() {
  const session = await requireCommunityMember()
  const [snapshot, phase, exercises] = await Promise.all([
    loadCommunitySnapshot(session),
    loadPhaseHome(session.userId),
    loadExercises(session.userId),
  ])
  const focus = todayFocus({
    hasDoctor: Boolean(snapshot.homeDoctor),
    checkedIn: Boolean(phase.feeling),
    plan: todayPlan(exercises.assignments),
  })
  return (
    <HomeScreen
      fullName={session.fullName}
      initial={memberInitial(session.fullName)}
      focus={focus}
    />
  )
}

function todayPlan(assignments: Awaited<ReturnType<typeof loadExercises>>['assignments']): TodayPlan | null {
  const library = assignments.find((assignment) => assignment.kind === 'library' && assignment.library && assignment.status !== 'done')
  if (library?.library) {
    const done = new Set(library.doneKeys)
    const stats = library.library.phases.map((phase) => {
      const progress = countDone(phase.exercises.map((exercise) => exercise.key), done)
      return { done: progress.finished, total: progress.total }
    })
    const index = firstOpenPhase(stats)
    const phase = library.library.phases[index]
    const stat = stats[index]
    if (!phase || !stat || stat.total < 1) return null
    return {
      title: library.title,
      detail: `${splitPhaseName(phase.name).short} · ${stat.total} moves`,
      done: stat.done,
      total: stat.total,
      href: '/portal/care/exercises',
    }
  }
  const custom = assignments.find((assignment) => assignment.kind === 'custom' && assignment.status !== 'done')
  if (!custom || custom.steps.length < 1) return null
  const finished = custom.steps.filter((step) => step.done).length
  return {
    title: custom.title,
    detail: `${custom.steps.length} steps`,
    done: finished,
    total: custom.steps.length,
    href: '/portal/care/exercises',
  }
}
