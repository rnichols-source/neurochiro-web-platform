import { redirect } from 'next/navigation'
import { GrowView } from '@/components/doctor/grow-view'
import { NetworkFrame } from '@/components/doctor/network-frame'
import { getPortalContext } from '@/lib/portal/context'

export const dynamic = 'force-dynamic'

export default async function NetworkGrowPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  return (
    <NetworkFrame active="/doctor/network/grow">
      <GrowView />
    </NetworkFrame>
  )
}
