import type { Metadata } from 'next'
import { HomeScreen } from '@/components/community/home-screen'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'
import { loadPhaseHome } from '@/lib/community/phase-data'
import { memberInitial } from '@/lib/community/logic'

export const metadata: Metadata = { title: 'Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function CommunityHomePage() {
  const session = await requireCommunityMember()
  const [snapshot, phase] = await Promise.all([
    loadCommunitySnapshot(session),
    loadPhaseHome(session.userId),
  ])
  return (
    <HomeScreen
      fullName={session.fullName}
      initial={memberInitial(session.fullName)}
      doctor={snapshot.homeDoctor}
      familyNames={snapshot.family.map((person) => person.firstName)}
      ready={snapshot.ready}
      phase={phase}
    />
  )
}
