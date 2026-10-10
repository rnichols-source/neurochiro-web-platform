import { getCoverageDoctors, getDemandData, getCoverageStats, getMentionsData, getReplyTemplates, getDemandScatterData, getOutreachLinks } from './actions'
import CoverageMapClient from './CoverageMapClient'

export const dynamic = 'force-dynamic'

export default async function CoveragePage() {
  const [doctors, demand, stats, mentions, templates, demandDots, outreachLinks] = await Promise.all([
    getCoverageDoctors(),
    getDemandData(),
    getCoverageStats(),
    getMentionsData(),
    getReplyTemplates(),
    getDemandScatterData(),
    getOutreachLinks(),
  ])

  return <CoverageMapClient doctors={doctors} demand={demand} stats={stats} mentions={mentions} templates={templates} demandDots={demandDots} outreachLinks={outreachLinks} />
}
