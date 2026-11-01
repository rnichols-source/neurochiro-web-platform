import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { asLooseDb, asRows } from '@/lib/synapse/loose-db'
import StudentPerkList, { type StudentPerk } from './student-perk-list'

export default async function StudentPerks() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'student') return null

  const db = asLooseDb(createAdminClient())
  const result = await db
    .from('vendor_perks')
    .select('id, vendor_id, seat_id, title, description, est_value_cents, audience, active')
    .eq('active', true)
    .in('audience', ['student', 'both'])
  if (result.error || !result.data) return null
  const rows = asRows<{
    id: string
    vendor_id: string
    title: string
    description: string | null
    est_value_cents: number | null
  }>(result.data)
  if (!rows.length) return null

  const vendorIds = [...new Set(rows.map((row) => row.vendor_id))]
  const vendors = await db.from('vendors').select('id, name').in('id', vendorIds)
  const seats = await db.from('synapse_seats').select('vendor_id, tier').in('vendor_id', vendorIds).in('status', ['active', 'at_risk', 'review'])
  const names = new Map(asRows<{ id: string; name: string }>(vendors.data).map((vendor) => [vendor.id, vendor.name]))
  const tiers = new Map(asRows<{ vendor_id: string; tier: string }>(seats.data).map((seat) => [seat.vendor_id, seat.tier]))
  const perks: StudentPerk[] = rows.flatMap((row) => {
    const tier = tiers.get(row.vendor_id)
    if (!tier) return []
    return [{
      id: row.id,
      vendorName: names.get(row.vendor_id) || 'Partner',
      title: row.title,
      description: row.description,
      estValueCents: row.est_value_cents,
      tier: tier === 'ally' ? 'ally' as const : 'anchor' as const,
    }]
  })
  if (!perks.length) return null
  return <StudentPerkList perks={perks} />
}
