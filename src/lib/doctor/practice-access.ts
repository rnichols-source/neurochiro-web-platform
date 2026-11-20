import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'

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
  const admin = createAdminClient() as any
  const own = await admin.from('doctors').select('id, clinic_name, city, state, country').eq('user_id', userId).maybeSingle()
  if (own.data?.id) {
    return {
      userId,
      doctorId: own.data.id,
      staff: false,
      clinicName: own.data.clinic_name || null,
      city: own.data.city || null,
      state: own.data.state || null,
      country: own.data.country || null,
    }
  }
  const membership = await admin
    .from('kpi_office_members')
    .select('office_user_id')
    .eq('member_user_id', userId)
    .eq('status', 'active')
    .limit(1)
  const officeUserId = membership.data?.[0]?.office_user_id as string | undefined
  if (!officeUserId) return null
  const office = await admin.from('doctors').select('id, clinic_name, city, state, country').eq('user_id', officeUserId).maybeSingle()
  if (!office.data?.id) return null
  return {
    userId,
    doctorId: office.data.id,
    staff: true,
    clinicName: office.data.clinic_name || null,
    city: office.data.city || null,
    state: office.data.state || null,
    country: office.data.country || null,
  }
}
