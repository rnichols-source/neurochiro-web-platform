import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { LIBRARY_PLAN_COUNT } from '@/lib/community/library-model'
import { loadHomeDoctorMembers, schemaNotReady } from '@/lib/community/phase-data'
import { weekStartKey } from '@/lib/community/phases'
import { getDoctorTimezone } from '@/lib/doctor-timezone'
import { greeting } from '@/lib/portal/greeting'
import { getDoctorPortalStats } from '@/lib/portal/stats-load'
import { listMyReferrals, listShortcuts } from '@/lib/referrals/data'
import { statusLabel } from '@/lib/referrals/pure'
import type { PortalContext } from '@/lib/portal/context'
import {
  agoLabel,
  buildNextSteps,
  doctorGreetingName,
  initialsFrom,
  profileChecklist,
  type NextStep,
  type ProfileChecklist,
} from '@/lib/doctor/places'

export type ThenItem = {
  id: string
  kind: string
  title: string
  subtitle: string
  href: string
  action: string
}

export type TodayData = {
  dateLabel: string
  greetingLine: string
  doctorName: string
  initials: string
  waiting: number
  newReferrals: number
  doingWell: number
  memberCount: number
  plansInUse: number | null
  libraryCount: number
  studentsNear: number | null
  checklist: ProfileChecklist
  step: NextStep
  stepIndex: number
  stepTotal: number
  thenItems: ThenItem[]
  requestCount: number | null
}

function countSentencesReady(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export async function countWaitingVisits(doctorId: string | null): Promise<number> {
  if (!doctorId) return 0
  const admin = createAdminClient() as any
  const rows = await admin.from('community_visit_requests').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'requested')
  if (rows.error) return 0
  return rows.count || 0
}

export async function loadToday(ctx: PortalContext, skipProfile = false): Promise<TodayData> {
  const doctor = ctx.doctor
  const timeZone = getDoctorTimezone(doctor?.state ?? null, doctor?.country ?? null, 'America/New_York') || 'America/New_York'
  const now = new Date()
  const admin = createAdminClient() as any
  const doctorId = doctor?.id || ''
  const emptyCheck = profileChecklist({
    photoUrl: null,
    bio: null,
    shortIntro: null,
    listingFormat: null,
    coOwnerCount: 0,
    city: doctor?.city || null,
    address: null,
    techniques: doctor?.specialties?.length || 0,
    hours: null,
  })

  const [profile, visits, members, assignments, students, stats, referrals] = await Promise.all([
    doctorId
      ? admin.from('doctors').select('photo_url, bio, short_intro, listing_format, co_owners, city, address, specialties, hours').eq('id', doctorId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    doctorId
      ? admin.from('community_visit_requests').select('id, created_at, status, shared_first_name, note, preferred_window').eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    doctorId ? loadHomeDoctorMembers(doctorId).catch(() => []) : Promise.resolve([]),
    doctorId
      ? admin.from('community_exercise_assignments').select('library_plan_slug').eq('doctor_id', doctorId).eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
    doctor?.city
      ? admin.from('students').select('id', { count: 'exact', head: true }).ilike('location_city', doctor.city)
      : Promise.resolve({ count: null, error: null }),
    doctorId
      ? getDoctorPortalStats({
        doctorId,
        userId: ctx.userId,
        range: 'month',
        city: doctor?.city,
        profileViews: doctor?.profile_views || 0,
        timeZone,
      }).catch(() => null)
      : Promise.resolve(null),
    listMyReferrals().catch(() => null),
  ])

  const row = profile.data || {}
  const coOwners = Array.isArray(row.co_owners) ? row.co_owners.filter((item: { name?: string }) => item?.name) : []
  const checklist = profile.data
    ? profileChecklist({
      photoUrl: countSentencesReady(row.photo_url),
      bio: countSentencesReady(row.bio),
      shortIntro: countSentencesReady(row.short_intro),
      listingFormat: countSentencesReady(row.listing_format),
      coOwnerCount: coOwners.length,
      city: countSentencesReady(row.city),
      address: countSentencesReady(row.address),
      techniques: Array.isArray(row.specialties) ? row.specialties.length : 0,
      hours: countSentencesReady(row.hours),
    })
    : emptyCheck

  const visitRows = visits.error ? [] : (visits.data || [])
  const waiting = visitRows.filter((item: { status?: string }) => item.status === 'requested').length
  const memberIds = members.map((member) => member.id)
  let doingWell = 0
  if (memberIds.length) {
    const checks = await admin.from('community_week_checkins').select('feeling').in('profile_id', memberIds).eq('week_start', weekStartKey(now))
    if (!checks.error) doingWell = (checks.data || []).filter((item: { feeling?: string }) => item.feeling === 'doing_well').length
  }
  const plansInUse = assignments.error || schemaNotReady(assignments.error)
    ? null
    : new Set((assignments.data || []).map((item: { library_plan_slug?: string | null }) => item.library_plan_slug).filter(Boolean)).size
  const received = (referrals?.received || []).filter((item) => ['pending', 'sent', 'viewed'].includes(item.status))
  const steps = buildNextSteps({
    checklist,
    skipProfile,
    waiting,
    referrals: ctx.unreadReferrals,
    unread: ctx.unreadMessages,
  })
  const thenItems: ThenItem[] = []
  const newestVisit = visitRows.find((item: { status?: string }) => item.status === 'requested') || visitRows[0]
  if (newestVisit) {
    const who = newestVisit.shared_first_name || 'A community member'
    thenItems.push({
      id: newestVisit.id,
      kind: 'Visit request',
      title: who,
      subtitle: [newestVisit.preferred_window, agoLabel(newestVisit.created_at)].filter(Boolean).join(' · ') || 'Asked to see you',
      href: '/doctor/people',
      action: 'Review',
    })
  }
  const newestReferral = received[0]
  if (newestReferral) {
    thenItems.push({
      id: newestReferral.id,
      kind: 'Referral',
      title: newestReferral.other_name || 'A doctor',
      subtitle: `${newestReferral.patient_first_name || 'Someone'} · ${statusLabel(newestReferral.status)}`,
      href: `/doctor/referrals/${newestReferral.id}`,
      action: 'Open',
    })
  }

  return {
    dateLabel: new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone }).format(now),
    greetingLine: greeting(now, timeZone),
    doctorName: doctorGreetingName(ctx.fullName),
    initials: ctx.initials || initialsFrom(ctx.fullName || ''),
    waiting,
    newReferrals: ctx.unreadReferrals,
    doingWell,
    memberCount: members.length,
    plansInUse,
    libraryCount: LIBRARY_PLAN_COUNT,
    studentsNear: students.error ? null : (typeof students.count === 'number' ? students.count : null),
    checklist,
    step: steps[0],
    stepIndex: 1,
    stepTotal: steps.filter((step) => step.id !== 'clear').length,
    thenItems,
    requestCount: stats?.patientRequests ? stats.patientRequests.total : null,
  }
}

export type PersonCard = {
  id: string
  profileId: string | null
  name: string
  detail: string
  note: string | null
  status: string
  kind: 'visit' | 'member'
}

export async function loadPeople(doctorId: string): Promise<{ ready: boolean; waiting: PersonCard[]; members: PersonCard[] }> {
  const admin = createAdminClient() as any
  const [visits, members] = await Promise.all([
    admin.from('community_visit_requests').select('id, profile_id, created_at, status, shared_first_name, for_first_name, note, preferred_window, shared_email, callback_phone').eq('doctor_id', doctorId).order('created_at', { ascending: false }).limit(40),
    loadHomeDoctorMembers(doctorId),
  ])
  if (visits.error && schemaNotReady(visits.error)) return { ready: false, waiting: [], members: [] }
  const waiting: PersonCard[] = (visits.data || []).map((row: Record<string, string | null>) => ({
    id: String(row.id),
    profileId: row.profile_id,
    name: row.shared_first_name || 'A community member',
    detail: [row.for_first_name ? `for ${row.for_first_name}` : null, row.preferred_window, agoLabel(String(row.created_at)), row.status].filter(Boolean).join(' · '),
    note: row.note,
    status: String(row.status || 'requested'),
    kind: 'visit' as const,
  }))
  return {
    ready: !visits.error,
    waiting,
    members: members.map((member) => ({
      id: member.id,
      profileId: member.id,
      name: member.label,
      detail: 'Chose you as their home doctor',
      note: null,
      status: 'home',
      kind: 'member' as const,
    })),
  }
}

export type ReferralCard = {
  id: string
  title: string
  detail: string
  status: string
  href: string
}

export async function loadReferralDesk(doctorId: string) {
  const [list, shortcuts] = await Promise.all([
    listMyReferrals(),
    listShortcuts(),
  ])
  const mapRow = (row: { id: string; patient_first_name?: string | null; patient_city?: string | null; other_name?: string; status: string; created_at: string }, direction: 'to' | 'from'): ReferralCard => ({
    id: row.id,
    title: direction === 'to'
      ? `${row.patient_first_name || 'Someone'} → ${row.other_name || 'Doctor'}`
      : `${row.patient_first_name || 'Someone'} from ${row.other_name || 'a doctor'}`,
    detail: [row.patient_city, agoLabel(row.created_at)].filter(Boolean).join(' · '),
    status: statusLabel(row.status),
    href: `/doctor/referrals/${row.id}`,
  })
  return {
    doctorId,
    sent: (list?.sent || []).map((row) => mapRow(row, 'to')),
    received: (list?.received || []).map((row) => mapRow(row, 'from')),
    trusted: shortcuts.favoriteIds.length,
  }
}

export type StudentCard = {
  id: string
  userId: string | null
  name: string
  school: string
  detail: string
  bucket: 'mentoring' | 'shadowing' | 'associate' | 'other'
}

function studentBucket(interests: unknown, looking: boolean, bio: string): StudentCard['bucket'] {
  const text = `${Array.isArray(interests) ? interests.join(' ') : ''} ${bio}`.toLowerCase()
  if (text.includes('shadow')) return 'shadowing'
  if (text.includes('associate')) return 'associate'
  if (looking || text.includes('mentor')) return 'mentoring'
  return 'other'
}

export async function loadStudentDesk(city: string | null): Promise<{ students: StudentCard[]; open: boolean; near: number | null }> {
  const admin = createAdminClient() as any
  const { createServerSupabase } = await import('@/lib/supabase-server')
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { students: [], open: false, near: null }
  const [mine, rows, near] = await Promise.all([
    admin.from('doctors').select('accepts_student_messages').eq('user_id', user.id).maybeSingle(),
    admin.from('students').select('id, user_id, full_name, school, graduation_year, interests, bio, is_looking_for_mentorship, location_city').order('created_at', { ascending: false }).limit(40),
    city
      ? admin.from('students').select('id', { count: 'exact', head: true }).ilike('location_city', city)
      : Promise.resolve({ count: null, error: null }),
  ])
  const students: StudentCard[] = (rows.error ? [] : rows.data || []).map((row: Record<string, unknown>) => {
    const year = row.graduation_year ? `class of ${row.graduation_year}` : ''
    const place = typeof row.location_city === 'string' ? row.location_city : ''
    return {
      id: String(row.id),
      userId: typeof row.user_id === 'string' ? row.user_id : null,
      name: typeof row.full_name === 'string' && row.full_name.trim() ? row.full_name : 'Student',
      school: typeof row.school === 'string' ? row.school : '',
      detail: [year, place].filter(Boolean).join(' · '),
      bucket: studentBucket(row.interests, row.is_looking_for_mentorship === true, typeof row.bio === 'string' ? row.bio : ''),
    }
  })
  return {
    students,
    open: mine.data?.accepts_student_messages === true,
    near: near.error ? null : (typeof near.count === 'number' ? near.count : null),
  }
}

export async function loadCareUsage(doctorId: string): Promise<Record<string, number>> {
  const admin = createAdminClient() as any
  const rows = await admin.from('community_exercise_assignments').select('library_plan_slug').eq('doctor_id', doctorId).eq('status', 'active')
  const counts: Record<string, number> = {}
  if (rows.error) return counts
  for (const row of rows.data || []) {
    const slug = row.library_plan_slug
    if (!slug) continue
    counts[slug] = (counts[slug] || 0) + 1
  }
  return counts
}
