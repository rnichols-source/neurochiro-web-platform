import UpgradeGate from '@/components/doctor/UpgradeGate'
import { getPortalContext } from '@/lib/portal/context'
import { lookupStaffOffice } from './actions'
import KpiLoader from './KpiLoader'

export default async function KpiTrackerPage() {
  const ctx = await getPortalContext()
  const staff = ctx && !ctx.doctor ? await lookupStaffOffice(ctx.userId) : false
  if (staff) return <KpiLoader />
  return (
    <UpgradeGate
      feature="KPI Tracker"
      requiredTier="pro"
      description="Track the practice numbers you choose, with goals for the day, week, and month."
    >
      <KpiLoader />
    </UpgradeGate>
  )
}
