import { getCoverageDoctors, getDemandData, getCoverageStats, getMentionsData, getReplyTemplates } from './actions'
import CoverageMapClient from './CoverageMapClient'

export const dynamic = 'force-dynamic'

export default async function CoveragePage() {
  const [doctors, demand, stats, mentions, templates] = await Promise.all([
    getCoverageDoctors(),
    getDemandData(),
    getCoverageStats(),
    getMentionsData(),
    getReplyTemplates(),
  ])

  return <CoverageMapClient doctors={doctors} demand={demand} stats={stats} mentions={mentions} templates={templates} />
}
