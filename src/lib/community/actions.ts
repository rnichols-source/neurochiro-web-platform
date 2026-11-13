'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  loadCommunitySnapshot,
  loadListedDoctor,
  requireCommunityMember,
} from '@/lib/community/data'
import {
  MAX_FAMILY,
  allowsAccountInvite,
  cleanFirstName,
  doctorVisitNotice,
  hasRecentOpenRequest,
  isRelationship,
  prepareVisitShare,
  privacyToRow,
  type PrivacyPrefs,
  type Relationship,
} from '@/lib/community/logic'
import { isPlausibleEmail } from '@/lib/leads/validate'
import { deliverVisitOfficeAlert } from '@/lib/community/visit-delivery'

export type ActionResult = { ok: true; notified?: boolean; claimed?: boolean; emailed?: boolean; texted?: boolean; textHeld?: boolean } | { ok: false; error: string }

function fail(error: string): ActionResult {
  return { ok: false, error }
}

function revalidateCommunity() {
  revalidatePath('/portal')
  revalidatePath('/portal/care')
  revalidatePath('/portal/family')
  revalidatePath('/portal/privacy')
  revalidatePath('/portal/visit')
  revalidatePath('/doctor/visit-requests')
}

async function ensureHousehold(admin: any, profileId: string): Promise<{ id: string } | null> {
  const existing = await admin.from('community_households').select('id').eq('owner_profile_id', profileId).maybeSingle()
  if (existing.error) return null
  if (existing.data?.id) return existing.data
  const created = await admin.from('community_households').insert({ owner_profile_id: profileId }).select('id').maybeSingle()
  if (created.error || !created.data?.id) return null
  return created.data
}

export async function setHomeDoctor(doctorId: string): Promise<ActionResult> {
  const session = await requireCommunityMember()
  const doctor = await loadListedDoctor(doctorId)
  if (!doctor) return fail('Choose a listed NeuroChiro doctor.')
  const admin = createAdminClient() as any
  const saved = await admin.from('community_home_doctors').upsert({
    profile_id: session.userId,
    doctor_id: doctor.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' }).select('profile_id').maybeSingle()
  if (saved.error || !saved.data) return fail('We could not save your home doctor yet.')
  revalidateCommunity()
  return { ok: true }
}

export async function addFamilyMember(input: {
  firstName: string
  relationship: string
  invitedEmail?: string
}): Promise<ActionResult> {
  const session = await requireCommunityMember()
  const firstName = cleanFirstName(input.firstName)
  if (!firstName) return fail('Use a first name, up to 40 letters.')
  if (!isRelationship(input.relationship)) return fail('Choose how this person is related to you.')
  const relationship = input.relationship as Relationship
  let invitedEmail: string | null = null
  if (allowsAccountInvite(relationship) && input.invitedEmail?.trim()) {
    if (!isPlausibleEmail(input.invitedEmail)) return fail('That email does not look usable.')
    invitedEmail = input.invitedEmail.trim().toLowerCase()
  }
  const admin = createAdminClient() as any
  const household = await ensureHousehold(admin, session.userId)
  if (!household) return fail('We could not open your household yet.')
  const existing = await admin.from('community_family_members').select('id', { count: 'exact', head: true }).eq('household_id', household.id)
  if ((existing.count || 0) >= MAX_FAMILY) return fail('This household already has 12 people besides you.')
  const inserted = await admin.from('community_family_members').insert({
    household_id: household.id,
    first_name: firstName,
    relationship,
    invited_email: invitedEmail,
  }).select('id').maybeSingle()
  if (inserted.error || !inserted.data) return fail('We could not add them yet.')
  revalidateCommunity()
  return { ok: true }
}

export async function removeFamilyMember(memberId: string): Promise<ActionResult> {
  const session = await requireCommunityMember()
  if (!memberId) return fail('Missing person.')
  const admin = createAdminClient() as any
  const household = await admin.from('community_households').select('id').eq('owner_profile_id', session.userId).maybeSingle()
  if (!household.data?.id) return fail('No household yet.')
  const removed = await admin
    .from('community_family_members')
    .delete()
    .eq('id', memberId)
    .eq('household_id', household.data.id)
    .select('id')
    .maybeSingle()
  if (removed.error || !removed.data) return fail('We could not remove them.')
  revalidateCommunity()
  return { ok: true }
}

export async function savePrivacy(prefs: PrivacyPrefs): Promise<ActionResult> {
  const session = await requireCommunityMember()
  const admin = createAdminClient() as any
  const saved = await admin.from('community_privacy').upsert(
    privacyToRow(session.userId, {
      shareNameWithHomeDoctor: prefs.shareNameWithHomeDoctor === true,
      shareEmailWithHomeDoctor: prefs.shareEmailWithHomeDoctor === true,
      sharePhoneWithHomeDoctor: prefs.sharePhoneWithHomeDoctor === true,
      shareFamilyFirstNamesWithHomeDoctor: prefs.shareFamilyFirstNamesWithHomeDoctor === true,
      shareHomeClinicWithOtherDoctors: prefs.shareHomeClinicWithOtherDoctors === true,
    }),
    { onConflict: 'profile_id' },
  ).select('profile_id').maybeSingle()
  if (saved.error || !saved.data) return fail('We could not save those choices yet.')
  revalidateCommunity()
  return { ok: true }
}

export async function requestVisit(input: {
  doctorId: string
  shareFirstName: boolean
  shareForName: boolean
  shareEmail: boolean
  sharePhone: boolean
  shareFamilyFirstNames: boolean
  forMemberId: string | null
  phone: string
  note: string
  preferredWindow: string
}): Promise<ActionResult> {
  const session = await requireCommunityMember()
  const doctor = await loadListedDoctor(input.doctorId)
  if (!doctor?.id) return fail('That doctor is not available for a visit request.')
  const snapshot = await loadCommunitySnapshot(session)
  if (!snapshot.ready) return fail('Visit requests need the latest database update before they can be saved.')
  if (hasRecentOpenRequest(snapshot.requests, doctor.id, new Date())) {
    return fail('You already asked this office for a visit today.')
  }
  const forMember = input.forMemberId
    ? snapshot.family.find((person) => person.id === input.forMemberId) || null
    : null
  if (input.forMemberId && !forMember) return fail('That family member is not on your household.')
  const share = prepareVisitShare({
    shareFirstName: input.shareFirstName,
    shareForName: input.shareForName && !!forMember,
    shareEmail: input.shareEmail,
    sharePhone: input.sharePhone,
    shareFamilyFirstNames: input.shareFamilyFirstNames,
    selfFirstName: session.fullName || '',
    email: session.email,
    phone: input.phone || session.phone,
    familyFirstNames: snapshot.family.map((person) => person.firstName),
    forFamilyFirstName: forMember?.firstName || null,
    note: input.note || '',
    preferredWindow: input.preferredWindow || '',
  })
  if (share.error) return fail(share.error)

  const admin = createAdminClient() as any
  const inserted = await admin.from('community_visit_requests').insert({
    profile_id: session.userId,
    doctor_id: doctor.id,
    family_member_id: forMember?.id || null,
    shared_first_name: share.sharedFirstName,
    for_first_name: share.forFirstName,
    shared_email: share.sharedEmail,
    callback_phone: share.callbackPhone,
    shared_family_names: share.sharedFamilyNames,
    note: share.note,
    preferred_window: share.preferredWindow,
    status: 'requested',
  }).select('id').maybeSingle()
  if (inserted.error || !inserted.data?.id) return fail('We could not save the visit request.')

  let notified = false
  if (doctor.user_id) {
    const notice = doctorVisitNotice(share)
    const note = await admin.from('notifications').insert({
      user_id: doctor.user_id,
      title: notice.title,
      body: notice.body,
      type: 'system',
      priority: 'important',
      link: '/doctor/visit-requests',
    })
    notified = !note.error
  }

  const office = await deliverVisitOfficeAlert({
    visitId: inserted.data.id,
    doctorId: doctor.id,
    share,
  })

  revalidateCommunity()
  return { ok: true, notified: notified || office.emailed || office.texted || office.textHeld, claimed: Boolean(doctor.user_id), emailed: office.emailed, texted: office.texted, textHeld: office.textHeld }
}

export async function markVisitSeen(formData: FormData): Promise<void> {
  const { createServerSupabase } = await import('@/lib/supabase-server')
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const requestId = String(formData.get('id') || '')
  if (!requestId) return
  const admin = createAdminClient() as any
  const doctor = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  if (!doctor.data?.id) return
  await admin.from('community_visit_requests').update({
    status: 'seen',
    seen_at: new Date().toISOString(),
  }).eq('id', requestId).eq('doctor_id', doctor.data.id).eq('status', 'requested')
  revalidatePath('/doctor/visit-requests')
}
