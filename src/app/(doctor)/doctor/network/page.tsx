import { redirect } from 'next/navigation'
import { ReferDesk } from '@/components/doctor/refer-desk'
import { NetworkFrame } from '@/components/doctor/network-frame'
import { getPortalContext } from '@/lib/portal/context'
import { loadReferralDesk } from '@/lib/doctor/portal-data'

export const dynamic = 'force-dynamic'

export default async function NetworkReferPage({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const ctx = await getPortalContext()
  if (!ctx?.doctor) redirect('/login')
  const who = (await searchParams).who || ''
  const desk = await loadReferralDesk(ctx.doctor.id)
  return (
    <NetworkFrame active="/doctor/network">
      <ReferDesk sent={desk.sent} received={desk.received} trusted={desk.trusted} initialWho={who} />
    </NetworkFrame>
  )
}
