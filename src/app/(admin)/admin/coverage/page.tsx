import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getCoverageMapData, getMissingCountryDoctors } from '@/lib/admin/coverage-data'
import { getInvisibleDoctors } from '../invisible-doctors/actions'
import CoverageExperience from './CoverageExperience'

export const dynamic = 'force-dynamic'

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }

  const params = await searchParams
  const tab = params.tab === 'pins' ? 'pins' : 'map'
  const updatedAt = new Date().toISOString()
  if (tab === 'pins') {
    const [invisible, missingCountry] = await Promise.all([
      getInvisibleDoctors(),
      getMissingCountryDoctors(),
    ])
    return (
      <Suspense fallback={<div className="p-4 text-sm text-neuro-navy">Loading coverage…</div>}>
        <CoverageExperience tab="pins" data={null} invisible={invisible} missingCountry={missingCountry} updatedAt={updatedAt} />
      </Suspense>
    )
  }

  const data = await getCoverageMapData()
  return (
    <Suspense fallback={<div className="p-4 text-sm text-neuro-navy">Loading coverage…</div>}>
      <CoverageExperience tab="map" data={data} invisible={[]} missingCountry={[]} updatedAt={updatedAt} />
    </Suspense>
  )
}
