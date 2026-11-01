import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { asLooseDb, type PostgrestError } from './loose-db.ts'

function missingColumn(error: PostgrestError | null): boolean {
  if (!error) return false
  return error.code === '42703' || error.code === 'PGRST204' || /column .* does not exist|schema cache/i.test(error.message || '')
}

/**
 * Active paying doctors. Uses doctors.subscription_status, the same field
 * src/lib/portal/membership-load.ts already reads. active and trialing count.
 * Founding members are active in deriveMembership, but this snapshot follows
 * subscription_status only. If that column is missing, fall back to a paid tier.
 */
export async function countActivePayingDoctors(): Promise<number> {
  const admin = asLooseDb(createAdminClient())
  const counted = await admin
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .in('subscription_status', ['active', 'trialing'])
  if (!counted.error) return counted.count || 0
  if (!missingColumn(counted.error)) {
    throw new Error('Could not count active paying members.')
  }
  const fallback = await admin
    .from('doctors')
    .select('id', { count: 'exact', head: true })
    .in('membership_tier', ['pro', 'neuros', 'growth'])
  if (fallback.error) throw new Error('Could not count active paying members.')
  return fallback.count || 0
}
