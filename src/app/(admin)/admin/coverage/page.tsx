import { getCoverageDoctors, getDemandData, getCoverageStats, getMentionsData } from './actions'
import CoverageMapClient from './CoverageMapClient'

export const dynamic = 'force-dynamic'

export default async function CoveragePage() {
  const [doctors, demand, stats, mentions] = await Promise.all([
    getCoverageDoctors(),
    getDemandData(),
    getCoverageStats(),
    getMentionsData(),
  ])

  return <CoverageMapClient doctors={doctors} demand={demand} stats={stats} mentions={mentions} />
}
