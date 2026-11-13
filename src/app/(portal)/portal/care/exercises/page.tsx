import type { Metadata } from 'next'
import Link from 'next/link'
import { ExerciseBoard } from '@/components/community/exercise-board'
import { LibraryPlanBoard } from '@/components/community/library-plan-board'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { LIBRARY_COPY } from '@/lib/community/library-model'
import { loadExercises } from '@/lib/community/phase-data'

export const metadata: Metadata = { title: 'Your exercises · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const session = await requireCommunityMember()
  const exercises = await loadExercises(session.userId)
  const library = exercises.assignments.filter((assignment) => assignment.kind === 'library' && assignment.library)
  const others = exercises.assignments.filter((assignment) => assignment.kind !== 'library')
  const realCustom = others.filter((assignment) => assignment.kind === 'custom')

  return (
    <div>
      <BackHeading title={LIBRARY_COPY.exercisesTitle} href="/portal/care" />
      <p className="mb-3 text-[13.5px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.questions}</p>
      {!exercises.ready ? (
        <Card>
          <Kicker>Almost ready</Kicker>
          <p className="text-[13.5px] text-[#3d4a57]">{LIBRARY_COPY.almostReady}</p>
        </Card>
      ) : null}
      {exercises.ready && library.length === 0 && realCustom.length === 0 ? (
        <Card>
          <Kicker>Nothing assigned yet</Kicker>
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">{LIBRARY_COPY.nothingAssigned}</p>
        </Card>
      ) : null}
      {library.length > 0 ? (
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
      ) : null}
      {exercises.ready ? <div className="mt-3"><ExerciseBoard assignments={others} sampleReady={exercises.sampleReady} /></div> : null}
      <Link href="/portal/care/remedies" className="mt-3 inline-block text-[13px] font-semibold text-[#B4501A]">Family remedies →</Link>
    </div>
  )
}
