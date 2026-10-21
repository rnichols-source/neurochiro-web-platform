import { getCoverageDoctors, getDemandData, getCoverageStats, getMentionsData, getReplyTemplates, getDemandScatterData, getOutreachLinks } from './actions'
import CoverageMapClient from './CoverageMapClient'
import { getThresholds } from '@/lib/thresholds'

export const dynamic = 'force-dynamic'

export default async function CoveragePage() {
  const pageStart = Date.now()

  // Phase 1: fetch data that other functions depend on
  const p1Start = Date.now()
  const [doctors, demand, mentions, templates, demandDots, outreachLinks, thresholds] = await Promise.all([
    getCoverageDoctors().then(r => { console.log(`[PERF] getCoverageDoctors: ${Date.now() - p1Start}ms (${r.length} rows)`); return r }),
    getDemandData().then(r => { console.log(`[PERF] getDemandData: ${Date.now() - p1Start}ms (${r.length} rows)`); return r }),
    getMentionsData().then(r => { console.log(`[PERF] getMentionsData: ${Date.now() - p1Start}ms (${r.length} rows)`); return r }),
    getReplyTemplates().then(r => { console.log(`[PERF] getReplyTemplates: ${Date.now() - p1Start}ms (${r.length} rows)`); return r }),
    getDemandScatterData().then(r => { console.log(`[PERF] getDemandScatterData: ${Date.now() - p1Start}ms (${r.length} rows)`); return r }),
    getOutreachLinks().then(r => { console.log(`[PERF] getOutreachLinks: ${Date.now() - p1Start}ms`); return r }),
    getThresholds(),
  ])
  console.log(`[PERF] Phase 1 (parallel): ${Date.now() - p1Start}ms`)

  // Phase 2: pass already-fetched data into stats (avoids triple-fetch)
  const p2Start = Date.now()
  const stats = await getCoverageStats(mentions, demand)
  console.log(`[PERF] getCoverageStats: ${Date.now() - p2Start}ms`)

  console.log(`[PERF] TOTAL SERVER: ${Date.now() - pageStart}ms`)

  return <CoverageMapClient doctors={doctors} demand={demand} stats={stats} mentions={mentions} templates={templates} demandDots={demandDots} outreachLinks={outreachLinks} gapRadius={thresholds.gap_radius} lookupMax={thresholds.lookup_max} />
}
