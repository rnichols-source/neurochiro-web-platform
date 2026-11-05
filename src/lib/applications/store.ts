import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn } from '@/lib/leads/schema'
import type { ApplicationAnswers } from './answers.ts'
import type { AdminApplicationRow } from './admin-row.ts'
import { doctorProfileUrl } from './approval-sms.ts'
import {
  applicationContactPatch,
  consentStatusLabel,
  contactFromAdminNotes,
  contactFromApplicationRow,
  doctorAlertPatch,
  humanAdminNotes,
  packAdminNotes,
} from './contact.ts'
import type { ApplicationRecord, ApplicationStatus, ApplicationWrite, DoctorWrite } from './decide.ts'
import type { DiscordApplication } from './discord.ts'

type Row = Record<string, unknown>

function one(result: LooseResult): Row | null {
  if (!result.data || Array.isArray(result.data)) return null
  return result.data
}

function many(result: LooseResult): Row[] {
  if (!result.data) return []
  return Array.isArray(result.data) ? result.data : [result.data]
}

type LooseError = { code?: string; message?: string } | null
type LooseResult = { data: Record<string, unknown> | Record<string, unknown>[] | null; error?: LooseError }

type LooseQuery = {
  select: (columns: string) => LooseQuery
  insert: (values: Record<string, unknown>) => LooseQuery
  update: (values: Record<string, unknown>) => LooseQuery
  eq: (column: string, value: unknown) => LooseQuery
  in: (column: string, values: string[]) => LooseQuery
  order: (column: string, options?: { ascending?: boolean }) => LooseQuery
  limit: (count: number) => LooseQuery
  maybeSingle: () => Promise<LooseResult>
  then: Promise<LooseResult>['then']
}

function db() {
  return createAdminClient() as unknown as {
    from: (table: string) => LooseQuery
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function statusOf(value: unknown): ApplicationStatus {
  if (value === 'under_review' || value === 'approved' || value === 'declined' || value === 'needs_action') return value
  return 'draft'
}

export type StoredApplication = ApplicationRecord & {
  answers: DiscordApplication
  priceLabel: string | null
  currency: string | null
}

export function mapApplication(row: Row, doctor?: Row | null, profile?: Row | null): StoredApplication {
  const firstName = text(doctor?.first_name) || text(profile?.full_name).split(' ')[0] || 'there'
  const lastName = text(doctor?.last_name)
  const email = text(profile?.email) || text(doctor?.email)
  const contact = contactFromApplicationRow(row)
  return {
    id: text(row.id),
    doctorId: text(row.doctor_id),
    userId: text(row.user_id) || null,
    status: statusOf(row.status),
    plan: row.plan === 'annual' ? 'annual' : row.plan === 'monthly' ? 'monthly' : null,
    stripePriceId: text(row.stripe_price_id) || null,
    stripeCustomerId: text(row.stripe_customer_id) || null,
    stripePaymentMethodId: text(row.stripe_payment_method_id) || null,
    stripeSubscriptionId: text(row.stripe_subscription_id) || null,
    cardOnFile: row.card_on_file === true,
    chargeAttempt: typeof row.charge_attempt === 'number' ? row.charge_attempt : 0,
    email,
    firstName,
    lastName,
    profileUrl: doctorProfileUrl(text(doctor?.slug)),
    mobileE164: contact.mobileE164 || null,
    smsConsent: contact.smsConsent,
    priceLabel: text(row.price_label) || null,
    currency: text(row.currency) || null,
    answers: {
      name: `${firstName} ${lastName}`.trim(),
      email,
      city: text(row.city),
      state: text(row.state),
      country: text(row.country),
      plan: text(row.plan) || null,
      currency: text(row.currency) || null,
      priceLabel: text(row.price_label) || null,
      cardOnFile: row.card_on_file === true,
      practiceApproach: text(row.practice_approach),
      techniques: text(row.techniques),
      usesNervousSystemScans: typeof row.uses_nervous_system_scans === 'boolean' ? row.uses_nervous_system_scans : null,
      scanTypes: text(row.scan_types),
      yearsInPractice: typeof row.years_in_practice === 'number' ? row.years_in_practice : null,
      officeAddress: text(row.office_address),
      website: text(row.website),
      instagram: text(row.instagram),
      heardAbout: text(row.heard_about),
      whyJoin: text(row.why_join),
    },
  }
}

async function doctorAndProfile(row: Row): Promise<StoredApplication> {
  const client = db()
  const doctorId = text(row.doctor_id)
  const userId = text(row.user_id)
  const [doctorResult, profileResult] = await Promise.all([
    doctorId ? client.from('doctors').select('first_name, last_name, email, slug').eq('id', doctorId).maybeSingle() : Promise.resolve({ data: null }),
    userId ? client.from('profiles').select('full_name, email').eq('id', userId).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return mapApplication(row, one(doctorResult), one(profileResult))
}

export async function ensureDraftApplication(input: {
  doctorId: string
  userId: string
  email: string
  referralCode?: string
}): Promise<boolean> {
  const client = db()
  const existing = await client.from('doctor_applications').select('id').eq('doctor_id', input.doctorId).maybeSingle()
  const existingRow = one(existing)
  if (existing.error) {
    console.error('[application] draft lookup failed', existing.error.code || 'error')
    return false
  }
  if (existingRow?.id) return true
  const inserted = await client.from('doctor_applications').insert({
    doctor_id: input.doctorId,
    user_id: input.userId,
    status: 'draft',
    referral_code: input.referralCode || null,
  })
  if (inserted.error) {
    console.error('[application] draft insert failed', inserted.error.code || 'error')
    return false
  }
  return true
}

export async function loadApplicationByDoctor(doctorId: string): Promise<StoredApplication | null> {
  const result = await db().from('doctor_applications').select('*').eq('doctor_id', doctorId).maybeSingle()
  const row = one(result)
  if (result.error || !row) return null
  return doctorAndProfile(row)
}

export async function loadApplicationById(id: string): Promise<StoredApplication | null> {
  const result = await db().from('doctor_applications').select('*').eq('id', id).maybeSingle()
  const row = one(result)
  if (result.error || !row) return null
  return doctorAndProfile(row)
}

const MOBILE_SQL = 'supabase/migrations/proposed/20261109120000_application_mobile_consent.sql'

function answerPatch(answers: ApplicationAnswers, referralCode: string, now: string): Record<string, unknown> {
  return {
    practice_approach: answers.practiceApproach,
    techniques: answers.techniques,
    uses_nervous_system_scans: answers.usesNervousSystemScans,
    scan_types: answers.scanTypes || null,
    years_in_practice: answers.yearsInPractice,
    office_address: answers.officeAddress,
    city: answers.city,
    state: answers.state || null,
    country: answers.country,
    website: answers.website || null,
    instagram: answers.instagram || null,
    heard_about: answers.heardAbout,
    why_join: answers.whyJoin,
    referral_code: referralCode || null,
    updated_at: now,
  }
}

export async function saveDoctorAlertPhone(doctorId: string, phone: string, consent: boolean, now: string): Promise<void> {
  const patch = doctorAlertPatch({ existingPhones: [], phone, consent, now })
  if (!patch || !doctorId) return
  const client = db()
  const current = await client.from('doctors').select('lead_alert_phones').eq('id', doctorId).maybeSingle()
  if (current.error) {
    if (isMissingColumn(current.error)) {
      console.error('[application] doctor text columns are not ready. Apply supabase/migrations/proposed/20261108000000_instant_lead_texts.sql')
      return
    }
    console.error('[application] could not read alert phones', current.error.code || 'error')
    return
  }
  const next = doctorAlertPatch({
    existingPhones: one(current)?.lead_alert_phones,
    phone,
    consent,
    now,
  })
  if (!next) return
  const updated = await client.from('doctors').update(next).eq('id', doctorId)
  if (updated.error) {
    if (isMissingColumn(updated.error)) {
      console.error('[application] doctor text columns are not ready. Apply supabase/migrations/proposed/20261108000000_instant_lead_texts.sql')
      return
    }
    console.error('[application] could not save alert phone', updated.error.code || 'error')
  }
}

export async function saveAnswers(doctorId: string, userId: string, answers: ApplicationAnswers, referralCode: string): Promise<boolean> {
  const now = new Date().toISOString()
  const client = db()
  const base = answerPatch(answers, referralCode, now)
  const contact = applicationContactPatch({
    mobileE164: answers.mobileE164,
    smsConsent: answers.smsConsent,
    now,
  })
  const withColumns = await client.from('doctor_applications').update({
    ...base,
    ...contact,
  }).eq('doctor_id', doctorId).eq('user_id', userId)
  if (withColumns.error && isMissingColumn(withColumns.error)) {
    console.error(`[application] mobile columns are missing. Apply ${MOBILE_SQL}`)
    const current = await client.from('doctor_applications').select('admin_notes').eq('doctor_id', doctorId).eq('user_id', userId).maybeSingle()
    const packed = packAdminNotes(text(one(current)?.admin_notes), {
      mobileE164: answers.mobileE164,
      smsConsent: answers.smsConsent,
      smsConsentAt: answers.smsConsent ? now : null,
    })
    const legacy = await client.from('doctor_applications').update({
      ...base,
      admin_notes: packed,
    }).eq('doctor_id', doctorId).eq('user_id', userId)
    if (legacy.error) {
      console.error('[application] answer save failed', legacy.error.code || 'error')
      return false
    }
  } else if (withColumns.error) {
    console.error('[application] answer save failed', withColumns.error.code || 'error')
    return false
  } else {
    const current = await client.from('doctor_applications').select('admin_notes').eq('doctor_id', doctorId).eq('user_id', userId).maybeSingle()
    const notes = text(one(current)?.admin_notes)
    if (contactFromAdminNotes(notes)) {
      await client.from('doctor_applications').update({
        admin_notes: humanAdminNotes(notes) || null,
      }).eq('doctor_id', doctorId).eq('user_id', userId)
    }
  }
  await saveDoctorAlertPhone(doctorId, answers.mobileE164, answers.smsConsent, now)
  return true
}

export async function savePlan(doctorId: string, input: {
  plan: 'monthly' | 'annual'
  currency: string
  priceId: string
  priceLabel: string
  customerId: string
}): Promise<void> {
  await db().from('doctor_applications').update({
    plan: input.plan,
    currency: input.currency,
    stripe_price_id: input.priceId,
    price_label: input.priceLabel,
    stripe_customer_id: input.customerId,
    updated_at: new Date().toISOString(),
  }).eq('doctor_id', doctorId)
  await db().from('doctors').update({ stripe_customer_id: input.customerId }).eq('id', doctorId)
}

export async function markCardOnFile(input: {
  applicationId: string
  customerId: string
  paymentMethodId: string
  sessionId: string
  userId: string
  doctorId: string
}): Promise<{ application: StoredApplication; notify: boolean } | null> {
  const client = db()
  const current = await client.from('doctor_applications').select('*').eq('id', input.applicationId).maybeSingle()
  const currentRow = one(current)
  if (current.error || !currentRow) return null
  if (text(currentRow.user_id) && input.userId && text(currentRow.user_id) !== input.userId) return null
  const terminal = currentRow.status === 'approved' || currentRow.status === 'declined'
  const alreadySaved = currentRow.card_on_file === true
  const notify = !alreadySaved && !terminal
  if (!alreadySaved) {
    const updated = await client.from('doctor_applications').update({
      stripe_customer_id: input.customerId,
      stripe_payment_method_id: input.paymentMethodId,
      stripe_setup_session_id: input.sessionId,
      card_on_file: true,
      status: terminal ? currentRow.status : 'under_review',
      updated_at: new Date().toISOString(),
    }).eq('id', input.applicationId)
    if (updated.error) return null
    if (input.userId) {
      await client.from('profiles').update({ stripe_customer_id: input.customerId }).eq('id', input.userId)
    }
    if (input.doctorId) {
      const doctorPatch: Record<string, string> = { stripe_customer_id: input.customerId }
      const city = text(currentRow.city)
      const state = text(currentRow.state)
      const country = text(currentRow.country)
      const address = text(currentRow.office_address)
      const website = text(currentRow.website)
      const instagram = text(currentRow.instagram)
      if (city) doctorPatch.city = city
      if (state) doctorPatch.state = state
      if (country) doctorPatch.country = country === 'OTHER' ? 'US' : country
      if (address) doctorPatch.address = address
      if (website) doctorPatch.website_url = website
      if (instagram) doctorPatch.instagram_url = `https://www.instagram.com/${instagram}/`
      await client.from('doctors').update(doctorPatch).eq('id', input.doctorId)
    }
  }
  const application = await loadApplicationById(input.applicationId)
  if (!application) return null
  return { application, notify }
}

export async function persistDecision(input: {
  applicationId: string
  doctorId: string
  reviewerId: string
  application: ApplicationWrite | null
  doctor: DoctorWrite | null
}): Promise<void> {
  const client = db()
  if (input.application) {
    const patch: Record<string, unknown> = {
      ...input.application,
      reviewed_by: input.reviewerId,
      updated_at: new Date().toISOString(),
    }
    if ('admin_notes' in input.application) {
      patch.admin_notes = await notesKeepingContact(input.applicationId, input.application.admin_notes)
    }
    await client.from('doctor_applications').update(patch).eq('id', input.applicationId)
  }
  if (input.doctor) {
    await client.from('doctors').update(input.doctor).eq('id', input.doctorId)
  }
}

async function notesKeepingContact(applicationId: string, nextNotes: string | null | undefined): Promise<string | null> {
  const client = db()
  const withPhone = await client.from('doctor_applications').select('admin_notes, mobile_e164').eq('id', applicationId).maybeSingle()
  if (withPhone.error && isMissingColumn(withPhone.error)) {
    const current = await client.from('doctor_applications').select('admin_notes').eq('id', applicationId).maybeSingle()
    return packAdminNotes(
      typeof nextNotes === 'string' ? nextNotes : '',
      contactFromAdminNotes(text(one(current)?.admin_notes)),
    )
  }
  const row = one(withPhone)
  if (text(row?.mobile_e164)) return humanAdminNotes(typeof nextNotes === 'string' ? nextNotes : '') || null
  return packAdminNotes(
    typeof nextNotes === 'string' ? nextNotes : '',
    contactFromAdminNotes(text(row?.admin_notes)),
  )
}

export type { AdminApplicationRow } from './admin-row.ts'

export async function listAdminApplications(): Promise<{ rows: AdminApplicationRow[]; error: string | null }> {
  const result = await db()
    .from('doctor_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (result.error) {
    return { rows: [], error: 'The applications table is not ready yet. Run the SQL file, then refresh this page.' }
  }
  const rows = many(result)
  const doctorIds = rows.map((row) => text(row.doctor_id)).filter(Boolean)
  const userIds = rows.map((row) => text(row.user_id)).filter(Boolean)
  const [doctors, profiles] = await Promise.all([
    doctorIds.length ? db().from('doctors').select('id, first_name, last_name, email, slug').in('id', doctorIds) : Promise.resolve({ data: [] }),
    userIds.length ? db().from('profiles').select('id, full_name, email').in('id', userIds) : Promise.resolve({ data: [] }),
  ])
  const doctorMap = new Map<string, Row>(many(doctors).map((row) => [text(row.id), row]))
  const profileMap = new Map<string, Row>(many(profiles).map((row) => [text(row.id), row]))
  return {
    rows: rows.map((row) => {
      const mapped = mapApplication(row, doctorMap.get(text(row.doctor_id)), profileMap.get(text(row.user_id)))
      const scans = mapped.answers.usesNervousSystemScans
        ? `Yes. ${mapped.answers.scanTypes}`
        : mapped.answers.usesNervousSystemScans === false
          ? 'No'
          : 'Not answered'
      return {
        id: mapped.id,
        status: mapped.status,
        name: mapped.answers.name || 'New doctor',
        email: mapped.email,
        city: mapped.answers.city,
        country: mapped.answers.country,
        plan: mapped.plan || 'Not chosen',
        priceLabel: mapped.priceLabel || mapped.currency || 'Not chosen',
        cardOnFile: mapped.cardOnFile,
        years: mapped.answers.yearsInPractice,
        approach: mapped.answers.practiceApproach,
        techniques: mapped.answers.techniques,
        scans,
        address: mapped.answers.officeAddress,
        website: mapped.answers.website,
        instagram: mapped.answers.instagram,
        heardAbout: mapped.answers.heardAbout,
        whyJoin: mapped.answers.whyJoin,
        notes: humanAdminNotes(text(row.admin_notes)),
        mobile: mapped.mobileE164 || '',
        smsConsent: mapped.smsConsent ? consentStatusLabel(true, contactFromApplicationRow(row).smsConsentAt) : 'No',
        createdAt: text(row.created_at),
      }
    }),
    error: null,
  }
}
