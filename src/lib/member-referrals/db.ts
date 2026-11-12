import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import {
  chooseReferral,
  cleanReferrerName,
  isPublishedActiveMember,
  memberDisplayName,
  normalizeRefSlug,
  parseReferrerName,
  referralBlock,
  type MemberSnapshot,
} from './logic.ts'
import type { ReferralCase, RewardRow, RewardStore } from './reward.ts'

const MIGRATION = 'supabase/migrations/20261112000000_member_referrals.sql'

const MEMBER_SELECT = 'id, user_id, email, slug, first_name, last_name, clinic_name, phone, address, verification_status, is_approved, is_founding_member, membership_tier, paid_at, stripe_customer_id, stripe_subscription_id'

type Row = Record<string, unknown>

/** False during a production build that has no Supabase env. Callers skip the query instead of throwing. */
export function referralDatabaseReady(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || url.includes('your-project-url')) return false
  if (!key) return false
  return true
}

function admin(): any {
  if (!referralDatabaseReady()) return null
  return createAdminClient()
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function memberFromRow(row: Row | null | undefined): MemberSnapshot | null {
  if (!row?.id) return null
  return {
    id: text(row.id),
    userId: text(row.user_id) || null,
    email: text(row.email) || null,
    slug: text(row.slug) || null,
    firstName: text(row.first_name),
    lastName: text(row.last_name),
    clinicName: text(row.clinic_name),
    phone: text(row.phone) || null,
    address: text(row.address) || null,
    verificationStatus: text(row.verification_status) || null,
    isApproved: row.is_approved === true,
    isFoundingMember: row.is_founding_member === true,
    membershipTier: text(row.membership_tier) || null,
    paidAt: text(row.paid_at) || null,
    stripeCustomerId: text(row.stripe_customer_id) || null,
  }
}

async function loadDoctor(column: 'id' | 'slug', value: string): Promise<MemberSnapshot | null> {
  const client = admin()
  if (!client || !value) return null
  const result = await client.from('doctors').select(MEMBER_SELECT).eq(column, value).maybeSingle()
  if (result.error) {
    console.error('[member-referral] doctor lookup failed', result.error.code || 'error')
    return null
  }
  return memberFromRow(result.data)
}

export async function loadMemberById(id: string): Promise<MemberSnapshot | null> {
  if (!id) return null
  return loadDoctor('id', id)
}

export async function resolveActiveMemberBySlug(slug: string): Promise<MemberSnapshot | null> {
  const normalized = normalizeRefSlug(slug)
  if (!normalized) return null
  const member = await loadDoctor('slug', normalized)
  if (!member || !isPublishedActiveMember(member)) return null
  return member
}

async function matchActiveMemberByName(name: string | null): Promise<MemberSnapshot | null> {
  const parsed = parseReferrerName(name)
  if (!parsed) return null
  const client = admin()
  if (!client) return null
  const result = await client
    .from('doctors')
    .select(MEMBER_SELECT)
    .ilike('first_name', parsed.first)
    .ilike('last_name', parsed.last)
    .limit(8)
  if (result.error || !Array.isArray(result.data)) return null
  const matches = (result.data as Row[])
    .map((row) => memberFromRow(row))
    .filter((row): row is MemberSnapshot => !!row && isPublishedActiveMember(row))
  return matches.length === 1 ? matches[0] : null
}

function eligible(candidate: MemberSnapshot | null, applicant: MemberSnapshot): MemberSnapshot | null {
  if (!candidate) return null
  if (!isPublishedActiveMember(candidate)) return null
  if (referralBlock(candidate, applicant)) return null
  return candidate
}

async function applicationReferral(doctorId: string): Promise<{ doctorId: string | null; slug: string | null; name: string | null } | null> {
  const client = admin()
  if (!client) return { doctorId: null, slug: null, name: null }
  const result = await client
    .from('doctor_applications')
    .select('referred_by_doctor_id, referral_code, referrer_name')
    .eq('doctor_id', doctorId)
    .maybeSingle()
  if (result.error && (isMissingColumn(result.error) || isMissingTable(result.error))) {
    const legacy = await client.from('doctor_applications').select('referral_code').eq('doctor_id', doctorId).maybeSingle()
    if (legacy.error || !legacy.data) return { doctorId: null, slug: null, name: null }
    return { doctorId: null, slug: normalizeRefSlug(text(legacy.data.referral_code)), name: null }
  }
  if (result.error) return null
  if (!result.data) return { doctorId: null, slug: null, name: null }
  return {
    doctorId: text(result.data.referred_by_doctor_id) || null,
    slug: normalizeRefSlug(text(result.data.referral_code)),
    name: cleanReferrerName(text(result.data.referrer_name)),
  }
}

async function writeAttribution(input: {
  applicant: MemberSnapshot
  doctorId: string | null
  slug: string | null
  name: string | null
}): Promise<void> {
  const client = admin()
  if (!client) return
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.doctorId) patch.referred_by_doctor_id = input.doctorId
  if (input.slug) patch.referral_code = input.slug
  if (input.name) patch.referrer_name = input.name
  if (Object.keys(patch).length === 1) return
  let current = { ...patch }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await client.from('doctor_applications').update(current).eq('doctor_id', input.applicant.id)
    if (!result.error) break
    if (!isMissingColumn(result.error)) {
      console.error('[member-referral] application save failed', result.error.code || 'error')
      break
    }
    console.error(`[member-referral] application column missing. Apply ${MIGRATION}`)
    delete current.referred_by_doctor_id
    delete current.referrer_name
    if (!('referral_code' in current) && !('referred_by_doctor_id' in current)) break
  }
  if (!input.doctorId) return
  const doctorPatch: Record<string, unknown> = { referred_by_doctor_id: input.doctorId }
  const doctor = await client.from('doctors').update(doctorPatch).eq('id', input.applicant.id)
  if (doctor.error && isMissingColumn(doctor.error)) {
    console.error(`[member-referral] doctor column missing. Apply ${MIGRATION}`)
  }
  if (input.applicant.userId) {
    const profile = await client.from('profiles').update({ referred_by_doctor_id: input.doctorId }).eq('id', input.applicant.userId)
    if (profile.error && isMissingColumn(profile.error)) {
      console.error(`[member-referral] profile column missing. Apply ${MIGRATION}`)
    }
  }
}

export async function rememberApplicantReferral(input: {
  applicantDoctorId: string
  requestedSlug?: string | null
  typedName?: string | null
}): Promise<{ slug: string | null; displayName: string | null; referrerName: string | null }> {
  const applicant = await loadMemberById(input.applicantDoctorId)
  if (!applicant) return { slug: null, displayName: null, referrerName: null }
  const stored = await applicationReferral(applicant.id)
  const requested = normalizeRefSlug(input.requestedSlug || '')
  const [linkMember, storedMember, nameMember] = await Promise.all([
    requested ? resolveActiveMemberBySlug(requested) : Promise.resolve(null),
    stored?.doctorId ? loadMemberById(stored.doctorId) : Promise.resolve(null),
    matchActiveMemberByName(input.typedName === undefined ? stored?.name || null : input.typedName),
  ])
  const choice = chooseReferral({
    linkMemberId: eligible(linkMember, applicant)?.id || null,
    linkSlug: eligible(linkMember, applicant)?.slug || null,
    storedMemberId: eligible(storedMember, applicant)?.id || null,
    storedSlug: eligible(storedMember, applicant)?.slug || stored?.slug || null,
    typedName: input.typedName === undefined ? stored?.name || null : input.typedName,
    nameMemberId: eligible(nameMember, applicant)?.id || null,
  })
  const chosen = choice.doctorId
    ? (linkMember?.id === choice.doctorId ? linkMember : storedMember?.id === choice.doctorId ? storedMember : nameMember)
    : null
  if (choice.doctorId || choice.name) {
    await writeAttribution({
      applicant,
      doctorId: choice.doctorId,
      slug: choice.slug,
      name: choice.name,
    })
  }
  return {
    slug: choice.slug,
    displayName: chosen ? memberDisplayName(chosen.firstName, chosen.lastName) : null,
    referrerName: choice.name,
  }
}

export async function referrerLabelForSlug(slug: string): Promise<string | null> {
  const member = await resolveActiveMemberBySlug(slug)
  if (!member) return null
  return memberDisplayName(member.firstName, member.lastName)
}

function rewardFromRow(row: Row): RewardRow {
  const status = text(row.status)
  return {
    id: text(row.id),
    referrerDoctorId: text(row.referrer_doctor_id),
    referredDoctorId: text(row.referred_doctor_id),
    applicationId: text(row.application_id) || null,
    status: status === 'granted' || status === 'failed' || status === 'skipped' || status === 'pending' ? status : 'pending',
    stripeReference: text(row.stripe_reference) || null,
    error: text(row.error) || text(row.skip_reason) || null,
  }
}

export function rewardStore(): RewardStore {
  return {
    async findByReferred(referredDoctorId) {
      const client = admin()
      if (!client) return null
      const result = await client.from('member_referral_rewards').select('*').eq('referred_doctor_id', referredDoctorId).maybeSingle()
      if (result.error) {
        if (isMissingTable(result.error)) console.error(`[member-referral] rewards table missing. Apply ${MIGRATION}`)
        return null
      }
      return result.data ? rewardFromRow(result.data) : null
    },
    async insertPending(row) {
      const client = admin()
      if (!client) throw new Error('referral database is not configured')
      const inserted = await client.from('member_referral_rewards').insert({
        referrer_doctor_id: row.referrerDoctorId,
        referred_doctor_id: row.referredDoctorId,
        application_id: row.applicationId,
        status: 'pending',
        idempotency_key: row.idempotencyKey,
        updated_at: new Date().toISOString(),
      }).select('*').maybeSingle()
      if (inserted.error || !inserted.data) {
        const existing = await client.from('member_referral_rewards').select('*').eq('referred_doctor_id', row.referredDoctorId).maybeSingle()
        if (existing.data) return rewardFromRow(existing.data)
        throw new Error(inserted.error?.code || 'reward insert failed')
      }
      return rewardFromRow(inserted.data)
    },
    async markGranted(id, patch) {
      const client = admin()
      if (!client) return
      await client.from('member_referral_rewards').update({
        status: 'granted',
        stripe_action: patch.stripeAction,
        amount_cents: patch.amount,
        currency: patch.currency,
        stripe_customer_id: patch.stripeCustomerId,
        stripe_subscription_id: patch.stripeSubscriptionId || null,
        stripe_reference: patch.stripeReference,
        period_end_before: patch.periodEndBefore,
        period_end_after: patch.periodEndAfter,
        error: null,
        skip_reason: null,
        granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    },
    async markFailed(id, error) {
      const client = admin()
      if (!client) return
      await client.from('member_referral_rewards').update({
        status: 'failed',
        error: error.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    },
    async markSkipped(row) {
      const client = admin()
      if (!client) return
      const existing = await client.from('member_referral_rewards').select('id').eq('referred_doctor_id', row.referredDoctorId).maybeSingle()
      const patch = {
        referrer_doctor_id: row.referrerDoctorId,
        referred_doctor_id: row.referredDoctorId,
        application_id: row.applicationId,
        status: 'skipped',
        skip_reason: row.reason,
        error: row.reason,
        idempotency_key: row.idempotencyKey,
        updated_at: new Date().toISOString(),
      }
      if (existing.data?.id) {
        await client.from('member_referral_rewards').update(patch).eq('id', existing.data.id)
        return
      }
      const inserted = await client.from('member_referral_rewards').insert(patch)
      if (inserted.error && !isMissingTable(inserted.error)) {
        console.error('[member-referral] skip save failed', inserted.error.code || 'error')
      }
    },
  }
}

export async function loadReferralCaseByApplication(applicationId: string): Promise<ReferralCase | null> {
  const client = admin()
  if (!client) return null
  const result = await client.from('doctor_applications').select('*').eq('id', applicationId).maybeSingle()
  if (result.error || !result.data) return null
  return caseFromApplication(result.data)
}

export async function loadReferralCaseByCustomer(customerId: string): Promise<ReferralCase | null> {
  const client = admin()
  if (!client) return null
  const result = await client.from('doctor_applications').select('*').eq('stripe_customer_id', customerId).maybeSingle()
  if (result.error || !result.data) return null
  return caseFromApplication(result.data)
}

async function caseFromApplication(row: Row): Promise<ReferralCase | null> {
  const referred = await loadMemberById(text(row.doctor_id))
  if (!referred) return null
  let referrerId = text(row.referred_by_doctor_id)
  if (!referrerId) {
    const slug = normalizeRefSlug(text(row.referral_code))
    const named = cleanReferrerName(text(row.referrer_name))
    const resolved = slug
      ? await resolveActiveMemberBySlug(slug)
      : await matchActiveMemberByName(named)
    const allowed = eligible(resolved, referred)
    if (allowed) {
      referrerId = allowed.id
      await writeAttribution({
        applicant: referred,
        doctorId: allowed.id,
        slug: allowed.slug,
        name: named,
      })
    }
  }
  const loadedReferrer = referrerId ? await loadMemberById(referrerId) : null
  const referrer = loadedReferrer && isPublishedActiveMember(loadedReferrer) ? loadedReferrer : null
  const client = admin()
  const profile = client && referred.userId
    ? await client.from('profiles').select('role').eq('id', referred.userId).maybeSingle()
    : { data: null, error: null }
  let referrerSubscriptionId: string | null = null
  if (referrer && client) {
    const extra = await client.from('doctors').select('stripe_subscription_id').eq('id', referrer.id).maybeSingle()
    if (!extra.error) referrerSubscriptionId = text(extra.data?.stripe_subscription_id) || null
  }
  return {
    applicationId: text(row.id),
    applicationStatus: text(row.status) || 'draft',
    referred,
    referrer,
    referredRole: text(profile.data?.role) || 'doctor',
    referredPriceId: text(row.stripe_price_id) || null,
    referredUnitAmount: null,
    referredCurrency: text(row.currency) || null,
    referrerSubscriptionId,
  }
}

export async function countGrantedReferrals(referrerDoctorId: string): Promise<number> {
  const client = admin()
  if (!client) return 0
  const result = await client
    .from('member_referral_rewards')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_doctor_id', referrerDoctorId)
    .eq('status', 'granted')
  if (result.error) return 0
  return result.count || 0
}

export async function bannerDismissedAt(doctorId: string): Promise<string | null> {
  const client = admin()
  if (!client) return null
  const result = await client.from('doctors').select('member_referral_banner_dismissed_at').eq('id', doctorId).maybeSingle()
  if (result.error) return null
  return text(result.data?.member_referral_banner_dismissed_at) || null
}

export async function dismissBanner(doctorId: string, userId: string): Promise<void> {
  const client = admin()
  if (!client) return
  const result = await client
    .from('doctors')
    .update({ member_referral_banner_dismissed_at: new Date().toISOString() })
    .eq('id', doctorId)
    .eq('user_id', userId)
  if (result.error && isMissingColumn(result.error)) {
    console.error(`[member-referral] banner column missing. Apply ${MIGRATION}`)
  }
}
