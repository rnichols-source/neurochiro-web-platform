import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn, isMissingTable } from '@/lib/leads/schema'
import {
  claimReviewAlert,
  decideDoctorClaim,
  doctorDisplayName,
  existingMemberLoginAlert,
  isBlankSignupRow,
  isPaidDoctor,
  normalizeClaimEmail,
  profilePatchForClaim,
  userAlreadyHasRealProfile,
  type ClaimCandidate,
  type ClaimDecision,
} from './claim-existing.ts'

const LOOKUP_LIMIT = 25

const COLUMN_SETS = [
  'id, user_id, email, first_name, last_name, slug, clinic_name, city, bio, membership_tier, verification_status, is_founding_member, is_approved, paid_at, stripe_customer_id',
  'id, user_id, email, first_name, last_name, slug, clinic_name, city, bio, membership_tier, verification_status, is_founding_member, is_approved, paid_at',
  'id, user_id, email, first_name, last_name, slug, clinic_name, city, bio, membership_tier, verification_status, is_founding_member, is_approved',
  'id, user_id, email, first_name, last_name, slug, membership_tier, verification_status',
]

export type ClaimAttempt = {
  status: 'claimed' | 'already-linked' | 'none' | 'review' | 'error'
  doctorId: string | null
  slug: string | null
}

type LooseResult = {
  data: Record<string, unknown>[] | null
  error: { code?: string; message?: string } | null
}

type LooseQuery = {
  select: (columns: string) => LooseQuery
  insert: (values: Record<string, unknown>) => Promise<LooseResult>
  update: (values: Record<string, unknown>) => LooseQuery
  delete: () => LooseQuery
  eq: (column: string, value: string) => LooseQuery
  neq: (column: string, value: string) => LooseQuery
  ilike: (column: string, pattern: string) => LooseQuery
  is: (column: string, value: null) => LooseQuery
  limit: (count: number) => LooseQuery
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { code?: string; message?: string } | null }>
  then: Promise<LooseResult>['then']
}

function db() {
  return createAdminClient() as unknown as { from: (table: string) => LooseQuery }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asCandidate(row: Record<string, unknown>): ClaimCandidate {
  return {
    id: text(row.id),
    user_id: text(row.user_id) || null,
    email: text(row.email) || null,
    first_name: text(row.first_name) || null,
    last_name: text(row.last_name) || null,
    slug: text(row.slug) || null,
    clinic_name: text(row.clinic_name) || null,
    city: text(row.city) || null,
    bio: text(row.bio) || null,
    membership_tier: text(row.membership_tier) || null,
    verification_status: text(row.verification_status) || null,
    is_founding_member: row.is_founding_member === true,
    is_approved: row.is_approved === true,
    paid_at: text(row.paid_at) || null,
    stripe_customer_id: text(row.stripe_customer_id) || null,
  }
}

async function selectRows(table: string, columns: string, apply: (query: LooseQuery) => LooseQuery): Promise<LooseResult | null> {
  const client = db()
  for (const set of columns.split('|')) {
    const result = await apply(client.from(table).select(set))
    if (!result.error) return result
    if (!isMissingColumn(result.error)) {
      console.error('[doctor-claim] lookup failed', result.error.code || 'error')
      return null
    }
  }
  return { data: [], error: null }
}

async function loadMatches(email: string): Promise<{ rows: ClaimCandidate[]; truncated: boolean } | null> {
  const normalized = normalizeClaimEmail(email)
  const escaped = normalized.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
  const pattern = `%${escaped}%`
  const selected = await selectRows('doctors', COLUMN_SETS.join('|'), (query) => query.ilike('email', pattern).limit(LOOKUP_LIMIT))
  if (!selected) return null
  const data = selected.data || []
  return {
    rows: data.map(asCandidate).filter((row) => row.id),
    truncated: data.length >= LOOKUP_LIMIT,
  }
}

async function stripeCustomerFromApplication(doctorId: string): Promise<string | null> {
  const result = await db().from('doctor_applications').select('stripe_customer_id').eq('doctor_id', doctorId).limit(5)
  if (result.error) {
    if (!isMissingColumn(result.error) && !isMissingTable(result.error)) {
      console.error('[doctor-claim] application customer lookup failed', result.error.code || 'error')
    }
    return null
  }
  const ids = (result.data || []).map((row) => text(row.stripe_customer_id)).filter(Boolean)
  return ids.length === 1 ? ids[0] : null
}

async function notify(content: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  } catch {
    console.error('[doctor-claim] discord failed')
  }
}

async function syncProfile(userId: string, email: string, doctor: ClaimCandidate): Promise<boolean> {
  const customer = doctor.stripe_customer_id || await stripeCustomerFromApplication(doctor.id)
  const patch = profilePatchForClaim({ ...doctor, stripe_customer_id: customer })
  const client = db()
  const existing = await client.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (existing.error) {
    console.error('[doctor-claim] profile lookup failed', existing.error.code || 'error')
    return false
  }
  if (existing.data?.id) {
    const updated = await client.from('profiles').update(patch).eq('id', userId)
    if (updated.error) {
      console.error('[doctor-claim] profile update failed', updated.error.code || 'error')
      return false
    }
    return true
  }
  const inserted = await client.from('profiles').insert({
    id: userId,
    email: normalizeClaimEmail(email),
    ...patch,
  })
  if (!inserted.error) return true
  const raced = await client.from('profiles').update(patch).eq('id', userId)
  if (raced.error) {
    console.error('[doctor-claim] profile insert failed', inserted.error.code || raced.error.code || 'error')
    return false
  }
  return true
}

async function removeBlankDuplicates(userId: string, claimedId: string): Promise<void> {
  const selected = await selectRows(
    'doctors',
    COLUMN_SETS.join('|'),
    (query) => query.eq('user_id', userId).neq('id', claimedId).limit(LOOKUP_LIMIT),
  )
  if (!selected?.data) return
  let leftInPlace = false
  for (const row of selected.data.map(asCandidate)) {
    if (!row.id || row.id === claimedId) continue
    if (!isBlankSignupRow(row)) {
      leftInPlace = true
      continue
    }
    const apps = await db().from('doctor_applications').delete().eq('doctor_id', row.id)
    if (apps.error && !isMissingTable(apps.error) && !isMissingColumn(apps.error)) {
      console.error('[doctor-claim] blank application delete failed', apps.error.code || 'error')
    }
    const removed = await db().from('doctors').delete().eq('id', row.id).eq('user_id', userId)
    if (removed.error) console.error('[doctor-claim] blank profile delete failed', removed.error.code || 'error')
  }
  if (leftInPlace) {
    console.error('[doctor-claim] login is linked to more than one doctor profile')
    await notify([
      '⚠️ **Doctor login is linked to more than one profile**',
      'The existing member profile was linked. Another profile on this same login was left in place.',
      'Search the doctor in Members: https://neurochiro.co/admin/members',
    ].join('\n'))
  }
}

async function linkRow(userId: string, doctor: ClaimCandidate): Promise<boolean> {
  const patch: Record<string, unknown> = { user_id: userId }
  if (isPaidDoctor(doctor)) patch.is_approved = true
  const client = db()
  let updated = await client.from('doctors').update(patch).eq('id', doctor.id).is('user_id', null).select('id')
  if (updated.error && isMissingColumn(updated.error)) {
    updated = await client.from('doctors').update({ user_id: userId }).eq('id', doctor.id).is('user_id', null).select('id')
  }
  if (updated.error) {
    console.error('[doctor-claim] link failed', updated.error.code || 'error')
    return false
  }
  return (updated.data || []).length > 0
}

function attemptFrom(decision: ClaimDecision, status: ClaimAttempt['status']): ClaimAttempt {
  if (decision.action === 'claim' || decision.action === 'already-linked') {
    return { status, doctorId: decision.doctor.id, slug: decision.doctor.slug || null }
  }
  return { status, doctorId: null, slug: null }
}

/**
 * Link an admin-built doctor profile when this login's email matches exactly one
 * unclaimed row. Signup and first login both call this. The auth callback and the
 * onboarding page do not create doctor rows, so the claim lives here instead of a
 * database trigger.
 */
export async function claimUnclaimedDoctor(input: {
  userId: string
  email: string
  source: 'signup' | 'login'
  displayName?: string
}): Promise<ClaimAttempt> {
  try {
    const loaded = await loadMatches(input.email)
    if (!loaded) return { status: 'error', doctorId: null, slug: null }
    const decision = decideDoctorClaim(input.userId, input.email, loaded.rows, { truncated: loaded.truncated })

    if (decision.action === 'none') return attemptFrom(decision, 'none')

    if (decision.action === 'review') {
      console.error('[doctor-claim] needs review', decision.reason)
      if (input.source === 'signup') await notify(claimReviewAlert({ email: input.email, reason: decision.reason }))
      return attemptFrom(decision, 'review')
    }

    if (decision.action === 'already-linked') {
      if (input.source === 'signup') {
        await notify(existingMemberLoginAlert({
          name: doctorDisplayName(decision.doctor, input.displayName || ''),
          email: input.email,
          slug: decision.doctor.slug,
        }))
      }
      return attemptFrom(decision, 'already-linked')
    }

    const owned = await selectRows(
      'doctors',
      COLUMN_SETS.join('|'),
      (query) => query.eq('user_id', input.userId).limit(LOOKUP_LIMIT),
    )
    if (owned?.data && userAlreadyHasRealProfile(owned.data.map(asCandidate))) {
      console.error('[doctor-claim] login already has a doctor profile')
      if (input.source === 'signup') {
        await notify([
          '⚠️ **Doctor signup needs a look**',
          `Email: ${input.email.trim()}`,
          'This new login already has a doctor profile, and another unclaimed profile uses the same email. Nothing was moved.',
          'Search the email in Members: https://neurochiro.co/admin/members',
        ].join('\n'))
      }
      const kept = owned.data.map(asCandidate).find((row) => !isBlankSignupRow(row))
      return { status: 'already-linked', doctorId: kept?.id || null, slug: kept?.slug || null }
    }

    const linked = await linkRow(input.userId, decision.doctor)
    if (!linked) {
      console.error('[doctor-claim] unclaimed row was taken before it could be linked')
      if (input.source === 'signup') await notify(claimReviewAlert({ email: input.email, reason: 'taken' }))
      return { status: 'review', doctorId: null, slug: null }
    }

    await syncProfile(input.userId, input.email, decision.doctor)
    await removeBlankDuplicates(input.userId, decision.doctor.id)
    await notify(existingMemberLoginAlert({
      name: doctorDisplayName(decision.doctor, input.displayName || ''),
      email: input.email,
      slug: decision.doctor.slug,
    }))
    return attemptFrom(decision, 'claimed')
  } catch (error) {
    console.error('[doctor-claim] failed', error instanceof Error ? error.name : 'error')
    return { status: 'error', doctorId: null, slug: null }
  }
}
