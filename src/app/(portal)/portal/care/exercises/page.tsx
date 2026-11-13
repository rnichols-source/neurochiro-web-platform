import type { Metadata } from 'next'
import { ExerciseBoard } from '@/components/community/exercise-board'
import { LibraryPlanBoard } from '@/components/community/library-plan-board'
import { requireCommunityMember } from '@/lib/community/data'
import { loadExercises } from '@/lib/community/phase-data'

export const metadata: Metadata = { title: 'My exercise plan · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const session = await requireCommunityMember()
  const exercises = await loadExercises(session.userId)
  const library = exercises.assignments.filter((assignment) => assignment.kind === 'library' && assignment.library)
  const others = exercises.assignments.filter((assignment) => assignment.kind !== 'library')

  return (
    <div>
      <LibraryPlanBoard
        assignments={library.map((assignment) => ({
          id: assignment.id,
          title: assignment.title,
          note: assignment.note,
          doctorName: assignment.doctorName,
          reminder: assignment.reminder,
          shareOnPassport: assignment.shareOnPassport,
          status: assignment.status,
          library: assignment.library!,
          doneKeys: assignment.doneKeys,
        }))}
      />
      {!exercises.ready ? <p className="mt-3 text-[14px] text-[#3d4a57]">Assignments save with the latest database update.</p> : null}
      {library.length === 0 || others.length > 0 ? (
        <div className="mt-4">
          <ExerciseBoard assignments={others} sampleReady={exercises.sampleReady} />
        </div>
      ) : null}
    </div>
  )
}
