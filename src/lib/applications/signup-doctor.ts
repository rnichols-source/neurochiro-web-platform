import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { rememberApplicantReferral } from '@/lib/member-referrals/db'
import { isListingOrPaidMembership, type ListingDoctor } from './existing-listing.ts'
import { isApplicationFlowEnabled } from './flag.ts'
import { toApplicationE164 } from './phone.ts'
import { currencyForCountry } from './prices.ts'
import { doctorSignupStatus } from './signup.ts'
import { ensureDraftApplication, saveDraftStep } from './store.ts'

type DoctorRow = Record<string, unknown>

function listingOf(row: DoctorRow, email: string): ListingDoctor {
  return {
    id: String(row.id || ''),
    email: typeof row.email === 'string' && row.email ? row.email : email,
    userId: row.user_id ? String(row.user_id) : null,
    isApproved: row.is_approved === true,
    verificationStatus: typeof row.verification_status === 'string' ? row.verification_status : null,
    paidAt: typeof row.paid_at === 'string' ? row.paid_at : null,
    membershipTier: typeof row.membership_tier === 'string' ? row.membership_tier : null,
    stripeSubscriptionId: typeof row.stripe_subscription_id === 'string' ? row.stripe_subscription_id : null,
  }
}

function exactEmail(email: string): string {
  return email.replace(/[\\%_]/g, (char) => `\\${char}`)
}

/**
 * Creates the doctors row for a new signup. If the insert fails, looks up the
 * row and tries once more so a created login is not left without a profile.
 * Does not attach an approved or paid listing.
 */
export async function ensureSignupDoctor(input: {
  userId: string
  email: string
  name: string
  phone?: string
  country?: string
  smsConsent?: boolean
  referralCode?: string
}): Promise<{ id: string } | null> {
  const userId = input.userId.trim()
  const email = input.email.trim().toLowerCase()
  if (!userId || !email.includes('@')) return null
  const admin = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: { id?: string } | null; error?: { code?: string } | null }> }
        ilike: (column: string, value: string) => Promise<{ data: DoctorRow[] | null; error?: { code?: string } | null }>
      }
      insert: (values: Record<string, unknown>) => { select: (columns: string) => { maybeSingle: () => Promise<{ data: { id?: string } | null; error?: { code?: string } | null }> } }
      update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => { is: (column: string, value: null) => { select: (columns: string) => { maybeSingle: () => Promise<{ data: { id?: string } | null; error?: { code?: string } | null }> } } } }
    }
  }
  const owned = await admin.from('doctors').select('id').eq('user_id', userId).maybeSingle()
  if (owned.error) console.error('[signup] doctor lookup failed', owned.error.code || 'error')
  if (owned.data?.id) {
    await attachDraft(String(owned.data.id), userId, email, input, false)
    return { id: String(owned.data.id) }
  }

  if (email) {
    const byEmail = await admin.from('doctors').select('id, email, user_id, is_approved, verification_status, paid_at, membership_tier, stripe_subscription_id').ilike('email', exactEmail(email))
    const rows = (byEmail.data || []) as DoctorRow[]
    const member = rows.find((row) => isListingOrPaidMembership(listingOf(row, email)))
    if (member) return null
    const open = rows.find((row) => !row.user_id && row.id)
    if (open?.id) {
      const linked = await admin.from('doctors').update({ user_id: userId }).eq('id', String(open.id)).is('user_id', null).select('id').maybeSingle()
      if (linked.data?.id) {
        await attachDraft(String(linked.data.id), userId, email, input, false)
        return { id: String(linked.data.id) }
      }
    }
  }

  const nameParts = input.name.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ')
  const country = (input.country || 'US').trim().toUpperCase() === 'UK' ? 'GB' : (input.country || 'US').trim().toUpperCase()
  const flow = isApplicationFlowEnabled()
  const payload = {
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email,
    clinic_name: '',
    city: '',
    state: '',
    country: flow ? country : 'US',
    address: '',
    bio: '',
    phone: input.phone || '',
    specialties: [],
    verification_status: flow ? 'hidden' : doctorSignupStatus(),
    membership_tier: 'free',
    region_code: country === 'OTHER' ? 'US' : (flow ? country : 'US'),
    is_approved: false,
    onboarding_call_status: 'not_booked',
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const slug = `${(input.name || 'doctor').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'doctor'}-${Date.now().toString(36)}${attempt ? '-r' : ''}`
    const inserted = await admin.from('doctors').insert({ ...payload, slug }).select('id').maybeSingle()
    if (inserted.data?.id) {
      await attachDraft(String(inserted.data.id), userId, email, input, true)
      return { id: String(inserted.data.id) }
    }
    console.error('[signup] doctor insert failed', inserted.error?.code || 'error')
    const again = await admin.from('doctors').select('id').eq('user_id', userId).maybeSingle()
    if (again.data?.id) {
      await attachDraft(String(again.data.id), userId, email, input, false)
      return { id: String(again.data.id) }
    }
  }
  return null
}

async function attachDraft(
  doctorId: string,
  userId: string,
  email: string,
  input: { phone?: string; country?: string; smsConsent?: boolean; referralCode?: string },
  fresh: boolean,
): Promise<void> {
  if (!isApplicationFlowEnabled()) return
  const country = (input.country || 'US').trim().toUpperCase() === 'UK' ? 'GB' : (input.country || 'US').trim().toUpperCase()
  await ensureDraftApplication({
    doctorId,
    userId,
    email,
    referralCode: (input.referralCode || '').slice(0, 80),
  })
  if (fresh) {
    const mobile = toApplicationE164(input.phone || '', country) || ''
    await saveDraftStep({
      doctorId,
      userId,
      stepReached: 1,
      referralCode: (input.referralCode || '').slice(0, 80),
      fields: {
        country,
        currency: currencyForCountry(country),
      },
      contact: mobile ? { mobileE164: mobile, smsConsent: input.smsConsent === true } : null,
    })
  }
  if (input.referralCode) {
    try {
      await rememberApplicantReferral({
        applicantDoctorId: doctorId,
        requestedSlug: input.referralCode,
      })
    } catch (error) {
      console.error('[signup] referral save failed', error instanceof Error ? error.name : 'error')
    }
  }
}
