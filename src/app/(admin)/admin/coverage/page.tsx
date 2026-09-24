import { getCoverageDoctors, getDemandData, getCoverageStats } from './actions'
import CoverageMapClient from './CoverageMapClient'

export const dynamic = 'force-dynamic'

export default async function CoveragePage() {
  const [doctors, demand, stats] = await Promise.all([
    getCoverageDoctors(),
    getDemandData(),
    getCoverageStats(),
  ])

  return <CoverageMapClient doctors={doctors} demand={demand} stats={stats} />
}
