import type { Metadata } from 'next'
import Link from 'next/link'
import { AccountPanel } from '@/components/community/account-panel'
import { BackHeading } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { displayFirstName } from '@/lib/community/logic'

export const metadata: Metadata = { title: 'You · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function YouPage() {
  const session = await requireCommunityMember()
  const name = displayFirstName(session.fullName) || 'Community member'
  return (
    <div>
      <BackHeading title="You" />
      <p className="mb-4 text-[13.5px] text-[#3d4a57]">Community member · free</p>
      <AccountPanel name={name} email={session.email || ''} />
      <Link href="/portal/privacy" className="mt-4 block rounded-2xl bg-[#fdf1ea] px-3.5 py-3">
        <strong className="mb-1 block font-heading text-[13px] font-bold text-neuro-navy">Privacy</strong>
        <p className="text-[12.5px] leading-snug text-[#3d4a57]">Choose what a home doctor, your household, or a passport introduction may see.</p>
      </Link>
    </div>
  )
}
