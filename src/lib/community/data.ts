import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { loginPathWithReturn } from '@/lib/auth/safe-return-path'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  DEFAULT_PRIVACY,
  HOME_PATH,
  doctorMayBeHomeDoctor,
  homeDoctorCard,
  isStoredCommunityRole,
  privacyFromRow,
  type DoctorCardSource,
  type HomeDoctorCard,
  type PrivacyPrefs,
  type Relationship,
} from '@/lib/community/logic'

const DOCTOR_COLUMNS = 'id, first_name, last_name, clinic_name, city, state, slug, photo_url, user_id, verification_status, membership_tier, is_approved, is_founding_member, paid_at, listing_format'

export type FamilyRow = {
  id: string
  firstName: string
  relationship: Relationship
  invitedEmail: string | null
}

export type VisitRow = {
  id: string
  doctorId: string
  status: string
  createdAt: string
  preferredWindow: string | null
  note: string | null
  sharedFirstName: string | null
  forFirstName: string | null
  sharedEmail: string | null
  sharedFamilyNames: string | null
  sharedPhone: boolean
  doctorTitle: string | null
}

export type CommunitySession = {
  userId: string
  email: string | null
  fullName: string | null
  phone: string | null
}

export type CommunitySnapshot = {
  session: CommunitySession
  ready: boolean
  homeDoctor: HomeDoctorCard | null
  family: FamilyRow[]
  privacy: PrivacyPrefs
  requests: VisitRow[]
}

type DbError = { message?: string; code?: string } | null

async function claimPendingCareInvites(userId: string, email: string | null) {
  if (!email) return
  const admin = createAdminClient() as any
  const invites = await admin.from('community_doctor_care_invites').select('id, doctor_id, plan_slug, note').ilike('email', email).is('claimed_profile_id', null)
  if (invites.error || !invites.data?.length) return
  const home = await admin.from('community_home_doctors').select('doctor_id').eq('profile_id', userId).maybeSingle()
  let homeDoctor = home.data?.doctor_id || null
  for (const invite of invites.data) {
    const existing = await admin.from('community_exercise_assignments').select('id').eq('profile_id', userId).eq('library_plan_slug', invite.plan_slug).eq('status', 'active').maybeSingle()
    if (!existing.data?.id) {
      await admin.from('community_exercise_assignments').insert({
        profile_id: userId,
        set_id: null,
        library_plan_slug: invite.plan_slug,
        doctor_id: invite.doctor_id,
        doctor_note: invite.note,
        status: 'active',
      })
    }
    if (!homeDoctor) {
      const inserted = await admin.from('community_home_doctors').insert({ profile_id: userId, doctor_id: invite.doctor_id }).select('doctor_id').maybeSingle()
      homeDoctor = inserted.data?.doctor_id || invite.doctor_id
    }
    await admin.from('community_doctor_care_invites').update({ claimed_profile_id: userId, claimed_at: new Date().toISOString() }).eq('id', invite.id)
  }
}

function missingRelation(error: DbError): boolean {
  if (!error) return false
  const message = error.message || ''
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache|could not find the table/i.test(message)
}

export async function requireCommunityMember(): Promise<CommunitySession> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const headerStore = await headers()
    const path = `${headerStore.get('x-pathname') || '/portal'}${headerStore.get('x-search') || ''}`
    redirect(loginPathWithReturn(path))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  await claimPendingCareInvites(user.id, user.email || null)

  const role = profile?.role || ''
  if (!isStoredCommunityRole(role)) {
    if (role === 'doctor' || role.startsWith('doctor')) redirect('/doctor/dashboard')
    if (role === 'student' || role.startsWith('student')) redirect('/student/dashboard')
    if (['admin', 'founder', 'super_admin', 'regional_admin'].includes(role)) redirect('/admin/dashboard')
    redirect('/dashboard')
  }

  const meta = (user.user_metadata || {}) as { phone?: string }
  return {
    userId: user.id,
    email: user.email || null,
    fullName: profile?.full_name || null,
    phone: typeof meta.phone === 'string' ? meta.phone : null,
  }
}

export async function loadCommunitySnapshot(session: CommunitySession): Promise<CommunitySnapshot> {
  const empty: CommunitySnapshot = {
    session,
    ready: true,
    homeDoctor: null,
    family: [],
    privacy: { ...DEFAULT_PRIVACY },
    requests: [],
  }
  const admin = createAdminClient() as any
  const [home, household, privacy, visits] = await Promise.all([
    admin.from('community_home_doctors').select('doctor_id').eq('profile_id', session.userId).maybeSingle(),
    admin.from('community_households').select('id').eq('owner_profile_id', session.userId).maybeSingle(),
    admin.from('community_privacy').select('*').eq('profile_id', session.userId).maybeSingle(),
    admin.from('community_visit_requests')
      .select('id, doctor_id, status, created_at, preferred_window, note, shared_first_name, for_first_name, shared_email, shared_family_names, callback_phone')
      .eq('profile_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if ([home.error, household.error, privacy.error, visits.error].some(missingRelation)) {
    return { ...empty, ready: false }
  }

  let family: FamilyRow[] = []
  if (household.data?.id) {
    const members = await admin
      .from('community_family_members')
      .select('id, first_name, relationship, invited_email')
      .eq('household_id', household.data.id)
      .order('created_at', { ascending: true })
      .limit(12)
    if (missingRelation(members.error)) return { ...empty, ready: false }
    family = (members.data || []).map(mapFamily)
  }

  const doctorIds = [
    home.data?.doctor_id,
    ...(visits.data || []).map((row: { doctor_id: string }) => row.doctor_id),
  ].filter(Boolean)
  const doctors = await loadDoctors(admin, doctorIds)
  const homeRow = home.data?.doctor_id ? doctors.get(home.data.doctor_id) : null

  return {
    session,
    ready: true,
    homeDoctor: homeRow ? homeDoctorCard(homeRow) : null,
    family,
    privacy: privacyFromRow(privacy.data),
    requests: (visits.data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      doctorId: String(row.doctor_id),
      status: String(row.status || 'requested'),
      createdAt: String(row.created_at),
      preferredWindow: (row.preferred_window as string | null) || null,
      note: (row.note as string | null) || null,
      sharedFirstName: (row.shared_first_name as string | null) || null,
      forFirstName: (row.for_first_name as string | null) || null,
      sharedEmail: (row.shared_email as string | null) || null,
      sharedFamilyNames: (row.shared_family_names as string | null) || null,
      sharedPhone: Boolean(row.callback_phone),
      doctorTitle: doctors.get(String(row.doctor_id)) ? homeDoctorCard(doctors.get(String(row.doctor_id))!).title : null,
    })),
  }
}

export async function loadListedDoctor(doctorId: string): Promise<(DoctorCardSource & { id: string; user_id?: string | null }) | null> {
  if (!doctorId) return null
  const admin = createAdminClient() as any
  const { data, error } = await admin.from('doctors').select(DOCTOR_COLUMNS).eq('id', doctorId).maybeSingle()
  if (error || !data) return null
  if (!doctorMayBeHomeDoctor(data)) return null
  return data
}

async function loadDoctors(admin: any, ids: string[]): Promise<Map<string, DoctorCardSource & { id: string }>> {
  const unique = [...new Set(ids)]
  const map = new Map<string, DoctorCardSource & { id: string }>()
  if (unique.length === 0) return map
  const { data } = await admin.from('doctors').select(DOCTOR_COLUMNS).in('id', unique)
  for (const row of data || []) map.set(row.id, row)
  return map
}

function mapFamily(row: { id: string; first_name: string; relationship: Relationship; invited_email: string | null }): FamilyRow {
  return {
    id: row.id,
    firstName: row.first_name,
    relationship: row.relationship,
    invitedEmail: row.invited_email,
  }
}

export function communityHomeHref(): string {
  return HOME_PATH
}

export type DoctorVisit = {
  id: string
  createdAt: string
  status: string
  preferredWindow: string | null
  note: string | null
  sharedFirstName: string | null
  forFirstName: string | null
  sharedEmail: string | null
  callbackPhone: string | null
  sharedFamilyNames: string | null
}

export async function loadDoctorVisitRequests(doctorId: string): Promise<{ ready: boolean; requests: DoctorVisit[] }> {
  const admin = createAdminClient() as any
  const { data, error } = await admin
    .from('community_visit_requests')
    .select('id, created_at, status, preferred_window, note, shared_first_name, for_first_name, shared_email, callback_phone, shared_family_names')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (missingRelation(error)) return { ready: false, requests: [] }
  return {
    ready: true,
    requests: (data || []).map((row: Record<string, string | null>) => ({
      id: String(row.id),
      createdAt: String(row.created_at),
      status: String(row.status || 'requested'),
      preferredWindow: row.preferred_window,
      note: row.note,
      sharedFirstName: row.shared_first_name,
      forFirstName: row.for_first_name,
      sharedEmail: row.shared_email,
      callbackPhone: row.callback_phone,
      sharedFamilyNames: row.shared_family_names,
    })),
  }
}
