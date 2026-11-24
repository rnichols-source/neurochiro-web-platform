import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  SELECTED_DOCTOR_COOKIE,
  compareListings,
  readSelectionFromCookie,
  resolveSelectedListing,
  type ListingSortFields,
} from '@/lib/portal/listings'

const IDENTITY_COLUMNS = 'id, city, state, country, clinic_name, first_name, last_name'
const IDENTITY_FALLBACK = 'id, city, clinic_name'

export type OwnedListingRow = ListingSortFields & Record<string, unknown>

type DoctorQuery = {
  data: unknown
  error: { message?: string; code?: string } | null
}

function asRows(data: unknown): OwnedListingRow[] {
  if (!Array.isArray(data)) return []
  return data.filter((row): row is OwnedListingRow => {
    return Boolean(row) && typeof row === 'object' && typeof (row as { id?: unknown }).id === 'string'
  })
}

async function queryRows(userId: string, columns: string): Promise<DoctorQuery> {
  const admin = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          limit: (count: number) => Promise<DoctorQuery>
        }
      }
    }
  }
  return admin.from('doctors').select(columns).eq('user_id', userId).limit(100)
}

/**
 * Every doctors row this login owns, ordered by city, then clinic or doctor name, then id.
 * Several rows do not error. The doctors.user_id index is not unique.
 */
export const loadDoctorsForUser = cache(async (userId: string): Promise<OwnedListingRow[]> => {
  const id = userId.trim()
  if (!id) return []
  let result = await queryRows(id, IDENTITY_COLUMNS)
  if (result.error) result = await queryRows(id, IDENTITY_FALLBACK)
  if (result.error || !Array.isArray(result.data)) return []
  return asRows(result.data).sort(compareListings)
})

export async function requestedDoctorId(userId: string): Promise<string | null> {
  try {
    const jar = await cookies()
    return readSelectionFromCookie(jar.get(SELECTED_DOCTOR_COOKIE)?.value, userId)
  } catch {
    return null
  }
}

/** Selected listing for this request. Invalid cookies fall back to the stable first listing. */
export async function portalListingsForUser(userId: string): Promise<{
  listings: OwnedListingRow[]
  selected: OwnedListingRow | null
}> {
  const listings = await loadDoctorsForUser(userId)
  const requested = await requestedDoctorId(userId)
  return { listings, selected: resolveSelectedListing(listings, requested) }
}

export async function selectedDoctorIdFor(userId: string): Promise<string | null> {
  const { selected } = await portalListingsForUser(userId)
  return selected?.id ?? null
}

/**
 * One doctors row for the listing this login is managing.
 * Ownership is checked with both id and user_id. Multiple rows do not use maybeSingle().
 */
export async function readSelectedDoctor<T = any>(
  userId: string,
  columns: string,
): Promise<{ data: T | null; error: { message?: string; code?: string } | null }> {
  const doctorId = await selectedDoctorIdFor(userId)
  if (!doctorId) return { data: null, error: null }
  const admin = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>
          }
        }
      }
    }
  }
  const result = await admin.from('doctors').select(columns).eq('id', doctorId).eq('user_id', userId).maybeSingle()
  return { data: result.data ?? null, error: result.error ?? null }
}

/** Public pages and other users' listings. Ignores the portal cookie and uses the stable first row. */
export async function readDefaultDoctor<T = any>(
  userId: string,
  columns: string,
): Promise<{ data: T | null; error: { message?: string; code?: string } | null }> {
  const listings = await loadDoctorsForUser(userId)
  const selected = resolveSelectedListing(listings, null)
  if (!selected) return { data: null, error: null }
  const admin = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>
          }
        }
      }
    }
  }
  const result = await admin.from('doctors').select(columns).eq('id', selected.id).eq('user_id', userId).maybeSingle()
  return { data: result.data ?? null, error: result.error ?? null }
}
