import type { Metadata } from 'next'
import { PrivacyForm } from '@/components/community/privacy-form'
import { BackHeading } from '@/components/community/ui'
import { loadCommunitySnapshot, requireCommunityMember } from '@/lib/community/data'

export const metadata: Metadata = { title: 'Privacy · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function PrivacyPage() {
  const session = await requireCommunityMember()
  const snapshot = await loadCommunitySnapshot(session)
  return (
    <div>
      <BackHeading title="Privacy" href="/portal/me" label="Me" crumb="Me › Privacy" area="me" />
      <p className="mb-4 text-[13.5px] leading-snug text-[#3d4a57]">Nothing is shared until you choose it, both here and again on a visit request or a passport introduction. Defaults are off. An exercise set travels only if you turn that on for the set.</p>
      {!snapshot.ready ? <p className="mb-3 text-[13.5px] text-[#B4501A]">Saving needs the latest database update.</p> : null}
      <PrivacyForm initial={snapshot.privacy} />
    </div>
  )
}
