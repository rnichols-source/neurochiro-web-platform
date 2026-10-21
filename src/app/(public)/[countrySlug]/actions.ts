'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function getCountryDemandStats(countryCode: string) {
  const supabase = createAdminClient()

  // Demand count
  const { count: demandCount } = await (supabase as any)
    .from('demand_mentions')
    .select('id', { count: 'exact', head: true })
    .eq('country', countryCode)

  // Date range
  const { data: oldest } = await (supabase as any)
    .from('demand_mentions')
    .select('mentioned_on')
    .eq('country', countryCode)
    .order('mentioned_on', { ascending: true })
    .range(0, 0) // intentional: single row

  const { data: newest } = await (supabase as any)
    .from('demand_mentions')
    .select('mentioned_on')
    .eq('country', countryCode)
    .order('mentioned_on', { ascending: false })
    .range(0, 0) // intentional: single row

  // Top cities
  const { data: cityRows } = await (supabase as any)
    .from('demand_mentions')
    .select('city')
    .eq('country', countryCode)
    .not('city', 'is', null)
    .range(0, 4999) // intentional bound

  const cityCounts: Record<string, number> = {}
  for (const r of (cityRows || [])) {
    const c = r.city || ''
    if (!c || c.length < 3 || c.toLowerCase() === countryCode.toLowerCase()) continue
    // Normalize London variants
    const norm = c === 'Greater London' ? 'London' : c === 'City of Nottingham' ? 'Nottingham' : c
    cityCounts[norm] = (cityCounts[norm] || 0) + 1
  }
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }))

  // Doctor count
  const { count: doctorCount } = await (supabase as any)
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .eq('country', countryCode)
    .eq('verification_status', 'verified')
    .eq('is_test', false)

  // Compute period framing
  const oldestDate = oldest?.[0]?.mentioned_on || ''
  const newestDate = newest?.[0]?.mentioned_on || ''
  let periodDays = 0
  if (oldestDate && newestDate) {
    periodDays = Math.round((new Date(newestDate).getTime() - new Date(oldestDate).getTime()) / 86400000) + 1
  }

  let periodLabel = ''
  if (periodDays <= 14) periodLabel = `in the last ${periodDays} days`
  else if (periodDays <= 35) periodLabel = 'in the last month'
  else if (periodDays <= 95) periodLabel = 'in the last 3 months'
  else periodLabel = ''

  return {
    demandCount: demandCount || 0,
    doctorCount: doctorCount || 0,
    topCities,
    periodLabel,
    oldestDate,
    newestDate,
  }
}
