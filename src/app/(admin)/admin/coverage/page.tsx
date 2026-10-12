import { getCoverageDoctors, getDemandData, getCoverageStats, getMentionsData, getReplyTemplates, getDemandScatterData, getOutreachLinks } from './actions'
import CoverageMapClient from './CoverageMapClient'

export const dynamic = 'force-dynamic'

export default async function CoveragePage() {
  // Phase 1: fetch data that other functions depend on
  const [doctors, demand, mentions, templates, demandDots, outreachLinks] = await Promise.all([
    getCoverageDoctors(),
    getDemandData(),
    getMentionsData(),
    getReplyTemplates(),
    getDemandScatterData(),
    getOutreachLinks(),
  ])

  // Phase 2: pass already-fetched data into stats (avoids triple-fetch)
  const stats = await getCoverageStats(mentions, demand)

  return <CoverageMapClient doctors={doctors} demand={demand} stats={stats} mentions={mentions} templates={templates} demandDots={demandDots} outreachLinks={outreachLinks} />
}
