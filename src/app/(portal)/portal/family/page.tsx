import type { Metadata } from 'next'
import { FamilyManager } from '@/components/community/family-form'
import { BackHeading, Card } from '@/components/community/ui'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'

export const metadata: Metadata = { title: 'Household · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function FamilyPage() {
  const session = await requireCommunityMember()
  const snapshot = await loadCommunitySnapshot(session)
  return (
    <div>
      <BackHeading title="Household" href="/portal/me" label="Me" crumb="Me › Household" area="me" />
      <p className="mb-3 text-[13.5px] leading-snug text-[#3d4a57]">People under your roof stay on your account. A child does not need a login. An adult’s email is saved here and is not sent.</p>
      {!snapshot.ready ? <p className="text-[13.5px] text-[#B4501A]">Saving a household needs the latest database update.</p> : null}
      <Card>
        <FamilyManager people={snapshot.family} />
      </Card>
    </div>
  )
}
