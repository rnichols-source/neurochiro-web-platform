import { redirect } from 'next/navigation'
import { DoctorBand } from '@/components/doctor/chrome'
import { ComingView } from '@/components/doctor/coming-view'
import { getPortalContext } from '@/lib/portal/context'

export const dynamic = 'force-dynamic'

export default async function ComingSoonPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  return (
    <div>
      <DoctorBand place="practice" title="Coming soon" subtitle="Synapse, the Network feed, and shadow requests." />
      <ComingView />
    </div>
  )
}
