'use client'

import { useEffect, useState } from 'react'
import UpgradeGate from '@/components/doctor/UpgradeGate'
import { getKpiWorkspace } from './actions'
import KpiApp from './KpiApp'
import type { KpiWorkspace } from '@/lib/kpi/types'

export default function KpiTrackerPage() {
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

function KpiLoader() {
  const [workspace, setWorkspace] = useState<KpiWorkspace | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zone, setZone] = useState('America/New_York')

  useEffect(() => {
    let browserZone = 'America/New_York'
    try {
      browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || browserZone
    } catch {
      browserZone = 'America/New_York'
    }
    let cancelled = false
    getKpiWorkspace(browserZone).then((result) => {
      if (cancelled) return
      setZone(browserZone)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setWorkspace(result.workspace)
    }).catch(() => {
      if (!cancelled) setError('We could not open the scorecard. Refresh and try again.')
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="max-w-lg mx-auto rounded-2xl border border-portal-border bg-white p-5" role="alert">
        <h1 className="text-[26px] leading-8 font-bold text-portal-ink">KPI tracker</h1>
        <p className="mt-2 text-[15px] leading-6 text-portal-ink-2">{error}</p>
      </div>
    )
  }
  if (!workspace) {
    return (
      <div className="min-h-40 flex items-center justify-center" role="status" aria-live="polite">
        <p className="text-sm font-bold text-portal-ink-2">Opening your scorecard…</p>
      </div>
    )
  }
  return <KpiApp initial={workspace} clientTimeZone={zone} />
}
