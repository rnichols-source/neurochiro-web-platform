/**
 * Member-to-doctor referrals.
 * The public link is the referring member's profile slug:
 * https://neurochiro.co/get-started?ref=dr-tyler-white
 *
 * Founding-rate wording expires on December 1. The free month does not.
 * Change FOUNDING_RATE_ENDS_AT to move that date.
 */

export const MEMBER_REF_COOKIE = 'nc_member_ref'

/** Midnight at the start of December 1, 2026, US Eastern (EST, UTC−5). */
export const FOUNDING_RATE_ENDS_AT = '2026-12-01T05:00:00.000Z'

export const MONTH_EXTENSION_SECONDS = 30 * 24 * 60 * 60

const PAID_TIERS = new Set(['basic', 'growth', 'pro', 'neuros'])
const NON_MEMBERSHIP_TYPES = new Set([
  'synapse_seat',
  'synapse_addon',
  'seminar_package',
  'job_feature',
  'job_post_nonmember',
  'course_purchase',
  'neuros_signup',
])

export type MemberSnapshot = {
  id: string
  userId: string | null
  email: string | null
  slug: string | null
  firstName: string
  lastName: string
  clinicName: string
  phone: string | null
  address: string | null
  verificationStatus: string | null
  isApproved: boolean | null
  isFoundingMember: boolean | null
  membershipTier: string | null
  paidAt: string | null
  stripeCustomerId: string | null
}

export type ReferralChoice = {
  doctorId: string | null
  slug: string | null
  name: string | null
  source: 'link' | 'stored' | 'name' | 'none'
}

export type SubscriptionSnapshot = {
  id: string
  status: string
  metadataType: string | null
  metadataRole: string | null
  priceId: string | null
  unitAmount: number | null
  currency: string
  interval: string | null
  quantity: number
  currentPeriodEnd: number | null
  trialEnd: number | null
}

export type RewardPlan =
  | { ok: true; action: 'credit'; amount: number; currency: string; subscriptionId: string }
  | { ok: true; action: 'extend'; trialEnd: number; from: number; subscriptionId: string }
  | { ok: false; reason: string }

export function foundingRateOpen(now: Date): boolean {
  return now.getTime() < Date.parse(FOUNDING_RATE_ENDS_AT)
}

export function normalizeRefSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null
  let raw = value.trim().toLowerCase()
  if (!raw) return null
  if (raw.includes('ref=')) {
    try {
      const url = new URL(raw.includes('://') ? raw : `https://${raw.replace(/^\/+/, '')}`)
      raw = (url.searchParams.get('ref') || '').trim().toLowerCase()
    } catch {
      const found = raw.match(/[?&]ref=([a-z0-9-]+)/)
      raw = found?.[1] || ''
    }
  }
  if (!/^[a-z0-9-]+$/.test(raw)) return null
  if (raw.length < 2 || raw.length > 80) return null
  if (!/[a-z]/.test(raw)) return null
  return raw
}

export function cleanReferrerName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[\u0000-\u001f]/g, '').trim().replace(/\s+/g, ' ').slice(0, 80)
  return cleaned.length >= 2 ? cleaned : null
}

export function parseReferrerName(value: string | null): { first: string; last: string } | null {
  if (!value) return null
  const stripped = value.replace(/^dr\.?\s+/i, '').trim()
  const parts = stripped.split(' ').filter(Boolean)
  if (parts.length < 2) return null
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (first.length < 2 || last.length < 2) return null
  return { first, last }
}

export function memberDisplayName(firstName: string, lastName: string): string {
  const name = `${firstName} ${lastName}`.trim()
  return name ? `Dr. ${name}` : 'a NeuroChiro member'
}

export function memberInviteUrl(slug: string, origin = 'https://neurochiro.co'): string {
  const base = origin.replace(/\/$/, '')
  return `${base}/get-started?ref=${encodeURIComponent(slug)}`
}

/** Query param, then cookie, then the saved draft. An empty value does not erase the others. */
export function persistedRef(input: { query?: string | null; cookie?: string | null; stored?: string | null }): string | null {
  return normalizeRefSlug(input.query) || normalizeRefSlug(input.cookie) || normalizeRefSlug(input.stored)
}

export function withReferralQuery(path: string, ref: string | null | undefined): string {
  const slug = normalizeRefSlug(ref || '')
  if (!slug) return path
  const [base, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  if (!params.get('ref')) params.set('ref', slug)
  const next = params.toString()
  return next ? `${base}?${next}` : base
}

export function inviteMessage(url: string, now: Date): string {
  if (foundingRateOpen(now)) {
    return `Hey, I thought of you for NeuroChiro — it's a network of nervous-system chiropractors that actually matches patients to doctors. If you want to take a look, you can still join at the founding rate before December 1. Here's my link: ${url}`
  }
  return `Hey, I thought of you for NeuroChiro — it's a network of nervous-system chiropractors that actually matches patients to doctors. Here's my link: ${url}`
}

export function bannerCopy(now: Date): { title: string; body: string } {
  if (foundingRateOpen(now)) {
    return {
      title: 'Introduce a doctor. Your next month is free.',
      body: 'New memberships go to $199/month on December 1. Your rate does not change. If a doctor you introduce is approved and pays, your next month is free — or your paid year is extended by a month. The founding rate is still open for them until December 1.',
    }
  }
  return {
    title: 'Introduce a doctor. Your next month is free.',
    body: 'When a doctor you introduce is approved and pays, your next month is free — or your paid year is extended by a month. New members join at $199/month. Your rate does not change.',
  }
}

export function cardExplanation(now: Date): string {
  if (foundingRateOpen(now)) {
    return 'When they are approved and pay, your next month is free. Founding rate for new doctors until December 1. Your rate stays the same.'
  }
  return 'When they are approved and pay, your next month is free. New doctors join at $199/month. Your rate stays the same.'
}

export function isPublishedActiveMember(row: {
  userId: string | null
  verificationStatus: string | null
  isApproved: boolean | null
  isFoundingMember: boolean | null
  membershipTier: string | null
  paidAt: string | null
}): boolean {
  if (!row.userId) return false
  const status = (row.verificationStatus || '').trim().toLowerCase()
  if (status === 'hidden') return false
  if (row.isApproved === true) return true
  if (row.isFoundingMember === true) return true
  if (row.paidAt) return true
  if (PAID_TIERS.has((row.membershipTier || '').trim().toLowerCase())) return true
  if (status === 'verified') return true
  return false
}

function norm(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function digits(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '')
}

/** Self, or another office of the same practice. Other clinics that share a name still count. */
export function referralBlock(referrer: MemberSnapshot, referred: MemberSnapshot): 'self' | 'same_practice' | null {
  if (referrer.id && referred.id && referrer.id === referred.id) return 'self'
  if (referrer.userId && referred.userId && referrer.userId === referred.userId) return 'self'
  const emailA = norm(referrer.email)
  const emailB = norm(referred.email)
  if (emailA && emailA === emailB) return 'self'
  if (
    referrer.stripeCustomerId
    && referred.stripeCustomerId
    && referrer.stripeCustomerId === referred.stripeCustomerId
  ) {
    return 'same_practice'
  }
  const clinicA = norm(referrer.clinicName)
  const clinicB = norm(referred.clinicName)
  if (!clinicA || clinicA !== clinicB) return null
  const phoneA = digits(referrer.phone)
  const phoneB = digits(referred.phone)
  if (phoneA.length >= 7 && phoneA === phoneB) return 'same_practice'
  const addressA = norm(referrer.address)
  const addressB = norm(referred.address)
  if (addressA.length >= 6 && addressA === addressB) return 'same_practice'
  return null
}

export function isStudentMembership(input: {
  role?: string | null
  currency?: string | null
  unitAmount?: number | null
  priceId?: string | null
  studentPriceIds?: string[]
}): boolean {
  const role = (input.role || '').trim().toLowerCase()
  if (role === 'student' || role === 'student_paid') return true
  if (input.priceId && (input.studentPriceIds || []).includes(input.priceId)) return true
  const currency = (input.currency || '').trim().toLowerCase()
  if (currency === 'usd' && (input.unitAmount === 3300 || input.unitAmount === 33300)) return true
  return false
}

/**
 * A real link wins. An unknown link is ignored and does not erase a referral
 * already saved on the draft. A typed name is used only when no member id is known.
 */
export function chooseReferral(input: {
  linkMemberId: string | null
  linkSlug: string | null
  storedMemberId: string | null
  storedSlug: string | null
  typedName: string | null
  nameMemberId: string | null
}): ReferralChoice {
  const name = cleanReferrerName(input.typedName || '')
  if (input.linkMemberId) {
    return { doctorId: input.linkMemberId, slug: input.linkSlug, name, source: 'link' }
  }
  if (input.storedMemberId) {
    return { doctorId: input.storedMemberId, slug: input.storedSlug, name, source: 'stored' }
  }
  if (input.nameMemberId) {
    return { doctorId: input.nameMemberId, slug: null, name, source: 'name' }
  }
  if (name) return { doctorId: null, slug: null, name, source: 'name' }
  return { doctorId: null, slug: null, name: null, source: 'none' }
}

export function referredMembershipQualifies(input: {
  applicationStatus: string
  subscriptionStatus: string | null
  invoicePaid: boolean
  role: string | null
  studentPrice: boolean
}): { ok: true } | { ok: false; reason: string } {
  if (input.studentPrice || isStudentMembership({ role: input.role })) {
    return { ok: false, reason: 'student' }
  }
  if (input.applicationStatus !== 'approved' && input.applicationStatus !== 'needs_action') {
    return { ok: false, reason: 'not_approved' }
  }
  const paid = input.invoicePaid || (input.subscriptionStatus || '').toLowerCase() === 'active'
  if (!paid) return { ok: false, reason: 'not_paid' }
  return { ok: true }
}

export function selectMembershipSubscription<T extends SubscriptionSnapshot>(
  subscriptions: T[],
  preferredId: string | null,
  doctorPriceIds: string[],
): T | null {
  const live = subscriptions.filter((item) => {
    const status = item.status.toLowerCase()
    if (status !== 'active' && status !== 'trialing') return false
    if (NON_MEMBERSHIP_TYPES.has(item.metadataType || '')) return false
    if ((item.metadataRole || '').toLowerCase() === 'student') return false
    if (isStudentMembership({ priceId: item.priceId, currency: item.currency, unitAmount: item.unitAmount, role: item.metadataRole, studentPriceIds: [] })) {
      return false
    }
    return true
  })
  if (preferredId) {
    const preferred = live.find((item) => item.id === preferredId)
    if (preferred) return preferred
  }
  const tagged = live.find((item) => item.metadataType === 'doctor_membership' || item.metadataRole === 'doctor')
  if (tagged) return tagged
  const known = live.filter((item) => item.priceId && doctorPriceIds.includes(item.priceId))
  if (known.length === 1) return known[0]
  if (live.length === 1) return live[0]
  return null
}

export function planMemberReward(subscription: SubscriptionSnapshot, nowUnix: number): RewardPlan {
  const status = subscription.status.toLowerCase()
  if (status !== 'active' && status !== 'trialing') return { ok: false, reason: 'referrer_not_paid' }
  if (!subscription.unitAmount || subscription.unitAmount <= 0) return { ok: false, reason: 'missing_price' }
  const interval = (subscription.interval || '').toLowerCase()
  if (interval === 'month') {
    const quantity = subscription.quantity > 0 ? subscription.quantity : 1
    return {
      ok: true,
      action: 'credit',
      amount: subscription.unitAmount * quantity,
      currency: (subscription.currency || 'usd').toLowerCase(),
      subscriptionId: subscription.id,
    }
  }
  if (interval === 'year') {
    const from = Math.max(subscription.currentPeriodEnd || 0, subscription.trialEnd || 0, nowUnix)
    if (!from) return { ok: false, reason: 'missing_period_end' }
    return {
      ok: true,
      action: 'extend',
      from,
      trialEnd: from + MONTH_EXTENSION_SECONDS,
      subscriptionId: subscription.id,
    }
  }
  return { ok: false, reason: 'unsupported_interval' }
}

export function rewardIdempotencyKey(referrerDoctorId: string, referredDoctorId: string): string {
  return `member-referral:${referrerDoctorId}:${referredDoctorId}`
}

export function rewardCountLabel(granted: number): string {
  const doctors = granted === 1 ? '1 doctor joined' : `${granted} doctors joined`
  const months = granted === 1 ? '1 month earned' : `${granted} months earned`
  return `${doctors} · ${months}`
}

type StripeItem = {
  quantity?: number | null
  current_period_end?: number | null
  price?: {
    id?: string
    unit_amount?: number | null
    currency?: string
    recurring?: { interval?: string | null } | null
  } | null
}

/** Reads the membership price off a Stripe subscription. Period end lives on the item in current API versions. */
export function toSubscriptionSnapshot(raw: {
  id?: string
  status?: string
  metadata?: { type?: string | null; role?: string | null } | null
  trial_end?: number | null
  current_period_end?: number | null
  items?: { data?: StripeItem[] }
}): SubscriptionSnapshot | null {
  if (!raw.id) return null
  const items = raw.items?.data || []
  const recurring = items.find((item) => item.price?.recurring?.interval) || items[0]
  const price = recurring?.price
  const periodEnd = recurring?.current_period_end ?? raw.current_period_end ?? null
  return {
    id: raw.id,
    status: raw.status || '',
    metadataType: raw.metadata?.type || null,
    metadataRole: raw.metadata?.role || null,
    priceId: price?.id || null,
    unitAmount: typeof price?.unit_amount === 'number' ? price.unit_amount : null,
    currency: price?.currency || 'usd',
    interval: price?.recurring?.interval || null,
    quantity: recurring?.quantity && recurring.quantity > 0 ? recurring.quantity : 1,
    currentPeriodEnd: typeof periodEnd === 'number' ? periodEnd : null,
    trialEnd: typeof raw.trial_end === 'number' ? raw.trial_end : null,
  }
}
