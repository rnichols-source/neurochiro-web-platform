import type { Metadata } from 'next'
import { CareView, type CarePlan } from '@/components/community/care-view'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'
import { remedyGuide } from '@/lib/community/library-content'
import { assignedByLine, countDone } from '@/lib/community/library-model'
import { loadExercises } from '@/lib/community/phase-data'
import { firstOpenPhase, splitPhaseName } from '@/lib/community/today'

export const metadata: Metadata = { title: 'Care · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

const CHIPS = [
  { label: 'Sore Throat', href: '/portal/care/remedies/sore-throat' },
  { label: 'Fever', href: '/portal/care/remedies/fever' },
  { label: 'Cough', href: '/portal/care/remedies/cough' },
  { label: 'Congestion', href: '/portal/care/remedies/congestion' },
  { label: 'Kids', href: '/portal/care/remedies/kids' },
]

export default async function CarePage() {
  const session = await requireCommunityMember()
  const [snapshot, exercises] = await Promise.all([
    loadCommunitySnapshot(session),
    loadExercises(session.userId),
  ])
  const doctor = snapshot.homeDoctor
  const guide = remedyGuide()
  return (
    <CareView
      doctor={doctor ? {
        id: doctor.id,
        title: doctor.title,
        meta: doctorMeta(doctor.place),
        initials: doctor.initials,
        photoUrl: doctor.photoUrl,
        listed: doctor.listed,
      } : null}
      plan={planCard(exercises.assignments)}
      chips={CHIPS}
      contacts={guide.emergency}
      requests={snapshot.requests.slice(0, 5).map((request) => ({
        id: request.id,
        label: `${request.doctorTitle || 'Doctor'} · ${request.status}${request.sharedFirstName ? '' : ' · name not shared'}`,
      }))}
    />
  )
}

function doctorMeta(place: string): string {
  const city = place.replace(/\s*· your home doctor$/, '').trim()
  if (!city || city === 'Your home doctor') return 'Your home doctor'
  return `Your home doctor · ${city}`
}

function planCard(assignments: Awaited<ReturnType<typeof loadExercises>>['assignments']): CarePlan | null {
  const library = assignments.find((assignment) => assignment.kind === 'library' && assignment.library && assignment.status !== 'done')
  if (!library?.library) {
    const custom = assignments.find((assignment) => assignment.kind === 'custom' && assignment.status !== 'done')
    if (!custom) return null
    const finished = custom.steps.filter((step) => step.done).length
    return {
      title: custom.title,
      assignedBy: assignedByLine(custom.doctorName),
      phases: [],
      meta: `${finished} of ${custom.steps.length} done today`,
    }
  }
  const done = new Set(library.doneKeys)
  const stats = library.library.phases.map((phase) => {
    const progress = countDone(phase.exercises.map((exercise) => exercise.key), done)
    return { done: progress.finished, total: progress.total }
  })
  const index = firstOpenPhase(stats)
  const phase = library.library.phases[index]
  const stat = stats[index]
  if (!phase || !stat) return null
  const parts = splitPhaseName(phase.name)
  return {
    title: library.title,
    assignedBy: assignedByLine(library.doctorName),
    phases: library.library.phases.map((item, itemIndex) => ({
      label: splitPhaseName(item.name).short,
      on: itemIndex === index,
    })),
    meta: `${parts.rest || phase.name} · ${phase.week} · ${stat.done} of ${stat.total} done today`,
  }
}
