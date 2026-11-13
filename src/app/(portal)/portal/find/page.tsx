import type { Metadata } from 'next'
import { FindDoctor } from '@/components/community/find-doctor'
import { BackHeading } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'

export const metadata: Metadata = { title: 'Find a home doctor · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function FindPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireCommunityMember()
  const params = await searchParams
  return (
    <div>
      <BackHeading title="Choose a home doctor" href="/portal/care" label="Care" crumb="Care › Choose a home doctor" area="care" />
      <p className="mb-3 text-[13.5px] leading-snug text-[#3d4a57]">Search the same directory as neurochiro.co. Only a listed doctor can be your home doctor.</p>
      <FindDoctor initialQuery={params.q || ''} />
    </div>
  )
}
