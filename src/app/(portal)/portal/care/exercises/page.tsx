import type { Metadata } from 'next'
import { ExerciseBoard } from '@/components/community/exercise-board'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'
import { loadExercises } from '@/lib/community/phase-data'

export const metadata: Metadata = { title: 'Exercises and remedies · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function ExercisesPage() {
  const session = await requireCommunityMember()
  const [snapshot, exercises] = await Promise.all([
    loadCommunitySnapshot(session),
    loadExercises(session.userId),
  ])
  const realSets = exercises.assignments.filter((assignment) => !assignment.sample)

  return (
    <div>
      <BackHeading title="Exercises and remedies" href="/portal/care" />
      <p className="mb-4 text-[13.5px] leading-snug text-[#3d4a57]">
        {snapshot.homeDoctor
          ? `${snapshot.homeDoctor.title} can assign a set from your visits. NeuroChiro is not your doctor, and a set is not a substitute for a visit.`
          : 'Choose a home doctor, and they can assign a set. NeuroChiro is not your doctor, and a set is not a substitute for a visit.'}
      </p>
      {!exercises.ready ? (
        <Card>
          <Kicker>Almost ready</Kicker>
          <p className="text-[13.5px] text-[#3d4a57]">Sets save with the latest database update.</p>
        </Card>
      ) : null}
      {exercises.ready && realSets.length === 0 ? (
        <Card>
          <Kicker>Nothing assigned yet</Kicker>
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">Your doctor can assign a set when you are under their care. There is no NeuroChiro library of stretches or remedies here.</p>
        </Card>
      ) : null}
      {exercises.ready ? <ExerciseBoard assignments={exercises.assignments} sampleReady /> : null}
    </div>
  )
}
