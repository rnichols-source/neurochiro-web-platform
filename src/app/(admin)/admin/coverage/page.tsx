import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getCoverageMapData, getMissingCountryDoctors } from '@/lib/admin/coverage-data'
import { getInvisibleDoctors } from '../invisible-doctors/actions'
import CoverageExperience from './CoverageExperience'
import { resolveAdminPlace, type AdminPlace } from './place-actions'

export const dynamic = 'force-dynamic'

type CoverageQuery = {
  tab?: string
  place?: string
  country?: string
  choice?: string
  code?: string
  near?: string
}

function radiusParam(value: string | undefined): number | null {
  const miles = Number(value)
  if (miles === 25 || miles === 50 || miles === 100 || miles === 250) return miles
  return null
}

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<CoverageQuery>
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
        <CoverageExperience tab="pins" data={null} invisible={invisible} missingCountry={missingCountry} updatedAt={updatedAt} placeResult={null} />
      </Suspense>
    )
  }

  const place = (params.place || '').trim()
  const choice = params.choice === 'state' || params.choice === 'country' ? params.choice : null
  const [data, placeResult] = await Promise.all([
    getCoverageMapData(),
    place
      ? resolveAdminPlace(place, params.country, radiusParam(params.near), choice, params.code)
      : Promise.resolve(null as AdminPlace | null),
  ])
  return (
    <Suspense fallback={<div className="p-4 text-sm text-neuro-navy">Loading coverage…</div>}>
      <CoverageExperience tab="map" data={data} invisible={[]} missingCountry={[]} updatedAt={updatedAt} placeResult={placeResult} />
    </Suspense>
  )
}
