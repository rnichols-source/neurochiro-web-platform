import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { portalListingsForUser } from '@/lib/portal/selected-doctor'

export type PracticeAccess = {
  userId: string
  doctorId: string
  staff: boolean
  clinicName: string | null
  city: string | null
  state: string | null
  country: string | null
}

/** Front desk can call and move a stage. Sending a home plan stays with the doctor. */
export function staffMaySendHomePlan(staff: boolean): boolean {
  return !staff
}

export async function requirePracticeAccess(): Promise<PracticeAccess | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return practiceAccessForUser(user.id)
}

export async function practiceAccessForUser(userId: string): Promise<PracticeAccess | null> {
  const own = await portalListingsForUser(userId)
  if (own.selected?.id) {
    return {
      userId,
      doctorId: own.selected.id,
      staff: false,
      clinicName: typeof own.selected.clinic_name === 'string' ? own.selected.clinic_name : null,
      city: own.selected.city || null,
      state: typeof own.selected.state === 'string' ? own.selected.state : null,
      country: typeof own.selected.country === 'string' ? own.selected.country : null,
    }
  }
  const admin = createAdminClient() as any
  const membership = await admin
    .from('kpi_office_members')
    .select('office_user_id')
    .eq('member_user_id', userId)
    .eq('status', 'active')
    .limit(1)
  const officeUserId = membership.data?.[0]?.office_user_id as string | undefined
  if (!officeUserId) return null
  const office = await portalListingsForUser(officeUserId)
  if (!office.selected?.id) return null
  return {
    userId,
    doctorId: office.selected.id,
    staff: true,
    clinicName: typeof office.selected.clinic_name === 'string' ? office.selected.clinic_name : null,
    city: office.selected.city || null,
    state: typeof office.selected.state === 'string' ? office.selected.state : null,
    country: typeof office.selected.country === 'string' ? office.selected.country : null,
  }
}
