import 'server-only'

import { unstable_cache } from 'next/cache'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { deriveMembership, type MembershipStatus } from '@/lib/portal/membership'
import { getDoctorCounts } from '@/lib/platform-stats'
import { countAttention } from '@/lib/leads/attention-count'
import { DEFAULT_LEAD_FOLLOWUP, parseLeadFollowupConfig } from '@/lib/leads/config'
import { isMissingColumn } from '@/lib/leads/schema'
import { looseFrom } from '@/lib/admin/loose-query'

const STATUSES = new Set<MembershipStatus>(['active', 'trialing', 'past_due', 'canceled', 'none'])
const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'])

export type CurrencyAmount = { currency: string; amount: number }

export type AdminToday = {
  generatedAt: string
  stripeOk: boolean
  paying: number | null
  trialing: number | null
  founding: number
  comped: number
  membersOk: boolean
  mrrUsd: number | null
  mrrOther: CurrencyAmount[]
  newDoctors7d: number | null
  waitlistConfirmed: number | null
  waitlistNew7d: number | null
  patientRequestsWaiting: number | null
  leadsWaitingOnDoctors: number | null
  escalationHours: number
  failedSubscriptions: number | null
  failedInvoices30d: number | null
  pendingApprovals: number | null
  invisibleDoctors: number | null
  activity: { id: string; category: string; event: string; user: string; target: string | null; timestamp: string }[]
}

type DoctorMetricRow = {
  id: string
  user_id: string | null
  membership_tier?: string | null
  is_founding_member?: boolean | null
  neuros_tier?: string | null
  created_at?: string | null
  verification_status?: string | null
  subscription_status?: string | null
}

type CouponBits = {
  percent_off?: number | null
  amount_off?: number | null
  currency?: string | null
  duration?: string | null
}

export function monthlyAmountCents(unitAmount: number, quantity: number, interval: string, intervalCount: number): number {
  const amount = unitAmount * (quantity || 1)
  const count = intervalCount || 1
  if (interval === 'month') return amount / count
  if (interval === 'year') return amount / (count * 12)
  if (interval === 'week') return (amount * 52) / (count * 12)
  if (interval === 'day') return (amount * 365) / (count * 12)
  return 0
}

function majorUnits(minor: number, currency: string): number {
  const divisor = ZERO_DECIMAL.has(currency.toLowerCase()) ? 1 : 100
  return Math.round(minor) / divisor
}

function customerId(customer: Stripe.Subscription['customer']): string | null {
  if (typeof customer === 'string') return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    if ('deleted' in customer && customer.deleted) return null
    return customer.id
  }
  return null
}

function couponsFrom(sub: Stripe.Subscription): CouponBits[] {
  const bag = sub as unknown as {
    discount?: { coupon?: CouponBits | null } | null
    discounts?: Array<{ coupon?: CouponBits | null } | string | null> | null
  }
  const out: CouponBits[] = []
  if (bag.discount?.coupon) out.push(bag.discount.coupon)
  for (const entry of bag.discounts || []) {
    if (entry && typeof entry === 'object' && entry.coupon) out.push(entry.coupon)
  }
  return out.filter((coupon) => coupon.duration !== 'once')
}

/** Monthly amount, in minor units, for one active subscription. Discounts apply when the coupon is on the subscription. */
export function subscriptionMonthlyByCurrency(sub: Stripe.Subscription): Map<string, number> {
  const totals = new Map<string, number>()
  const coupons = couponsFrom(sub)
  let percent = 1
  for (const coupon of coupons) {
    if (typeof coupon.percent_off === 'number' && coupon.percent_off > 0) {
      percent *= 1 - coupon.percent_off / 100
    }
  }
  const items = sub.items?.data || []
  let primary: { interval: string; intervalCount: number } | null = null
  for (const item of items) {
    const price = item.price
    const recurring = price?.recurring
    if (!price || !recurring?.interval) continue
    const intervalCount = recurring.interval_count || 1
    if (!primary) primary = { interval: recurring.interval, intervalCount }
    const currency = (price.currency || 'usd').toLowerCase()
    const monthly = monthlyAmountCents(price.unit_amount || 0, item.quantity || 1, recurring.interval, intervalCount) * percent
    totals.set(currency, (totals.get(currency) || 0) + monthly)
  }
  for (const coupon of coupons) {
    if (!primary || typeof coupon.amount_off !== 'number' || coupon.amount_off <= 0) continue
    const currency = (coupon.currency || [...totals.keys()][0] || 'usd').toLowerCase()
    const off = monthlyAmountCents(coupon.amount_off, 1, primary.interval, primary.intervalCount)
    totals.set(currency, Math.max(0, (totals.get(currency) || 0) - off))
  }
  return totals
}

async function listSubscriptions(status: Stripe.SubscriptionListParams['status']): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = []
  for await (const sub of stripe.subscriptions.list({ status, limit: 100 })) {
    out.push(sub)
  }
  return out
}

async function countFailedInvoices(): Promise<number> {
  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
  let failed = 0
  for await (const invoice of stripe.invoices.list({ created: { gte: since }, limit: 100 })) {
    const attempts = invoice.attempt_count || 0
    if (invoice.status === 'uncollectible' || (invoice.status === 'open' && attempts > 0)) failed += 1
  }
  return failed
}

function idSet(subs: Stripe.Subscription[]): Set<string> {
  const ids = new Set<string>()
  for (const sub of subs) {
    const id = customerId(sub.customer)
    if (id) ids.add(id)
  }
  return ids
}

async function eachPage<T>(
  load: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const size = 1000
  const all: T[] = []
  for (let from = 0; from < 20000; from += size) {
    const { data, error } = await load(from, from + size - 1)
    if (error) throw new Error(error.message)
    const batch = data || []
    all.push(...batch)
    if (batch.length < size) break
  }
  return all
}

async function loadDoctors(admin: ReturnType<typeof createAdminClient>): Promise<DoctorMetricRow[]> {
  const selects = [
    'id, user_id, membership_tier, is_founding_member, neuros_tier, created_at, verification_status, subscription_status',
    'id, user_id, membership_tier, is_founding_member, neuros_tier, created_at, verification_status',
    'id, user_id, membership_tier, created_at, verification_status',
  ]
  return eachPage(async (from, to) => {
    let last: { data: DoctorMetricRow[] | null; error: { message: string; code?: string; details?: string } | null } | null = null
    for (const columns of selects) {
      const res = await looseFrom(admin, 'doctors').select(columns).range(from, to)
      const shaped = { data: (res.data as DoctorMetricRow[] | null) ?? null, error: res.error }
      if (!shaped.error) return shaped
      last = shaped
      if (!isMissingColumn(shaped.error)) return shaped
    }
    return last!
  })
}

async function loadAdminTodayUncached(): Promise<AdminToday> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const snapshot: AdminToday = {
    generatedAt: new Date().toISOString(),
    stripeOk: false,
    paying: null,
    trialing: null,
    founding: 0,
    comped: 0,
    membersOk: false,
    mrrUsd: null,
    mrrOther: [],
    newDoctors7d: null,
    waitlistConfirmed: null,
    waitlistNew7d: null,
    patientRequestsWaiting: null,
    leadsWaitingOnDoctors: null,
    escalationHours: DEFAULT_LEAD_FOLLOWUP.admin_escalation_hours,
    failedSubscriptions: null,
    failedInvoices30d: null,
    pendingApprovals: null,
    invisibleDoctors: null,
    activity: [],
  }

  let doctors: DoctorMetricRow[] = []
  const profileByUser = new Map<string, { tier: string | null; stripe_customer_id: string | null }>()
  try {
    doctors = await loadDoctors(admin)
    const userIds = [...new Set(doctors.map((doctor) => doctor.user_id).filter((id): id is string => Boolean(id)))]
    for (let i = 0; i < userIds.length; i += 200) {
      const chunk = userIds.slice(i, i + 200)
      const { data, error } = await admin.from('profiles').select('id, tier, stripe_customer_id').in('id', chunk)
      if (error) throw new Error(error.message)
      for (const row of data || []) {
        profileByUser.set(row.id, { tier: row.tier, stripe_customer_id: row.stripe_customer_id })
      }
    }
    const created = await admin.from('doctors').select('id', { count: 'exact', head: true }).gte('created_at', since)
    if (created.error) throw new Error(created.error.message)
    snapshot.newDoctors7d = created.count || 0
    const pending = await admin.from('doctors').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending')
    if (pending.error) throw new Error(pending.error.message)
    snapshot.pendingApprovals = pending.count || 0
    snapshot.membersOk = true
  } catch (err) {
    console.error('admin today doctors', err instanceof Error ? err.name : 'error')
  }

  try {
    const counts = await getDoctorCounts()
    snapshot.invisibleDoctors = counts.invisible
  } catch (err) {
    console.error('admin today invisible', err instanceof Error ? err.name : 'error')
  }

  try {
    const confirmed = await looseFrom(admin, 'subscribers').select('id', { count: 'exact', head: true }).eq('status', 'confirmed')
    if (confirmed.error) throw new Error(confirmed.error.message)
    const fresh = await looseFrom(admin, 'subscribers').select('id', { count: 'exact', head: true }).gte('created_at', since)
    if (fresh.error) throw new Error(fresh.error.message)
    snapshot.waitlistConfirmed = confirmed.count || 0
    snapshot.waitlistNew7d = fresh.count || 0
  } catch (err) {
    console.error('admin today waitlist', err instanceof Error ? err.name : 'error')
  }

  try {
    snapshot.patientRequestsWaiting = await countAttention()
  } catch (err) {
    console.error('admin today attention', err instanceof Error ? err.name : 'error')
  }

  try {
    const setting = await looseFrom(admin, 'platform_settings').select('value').eq('key', 'lead_followup').maybeSingle()
    const config = parseLeadFollowupConfig(setting.error ? undefined : setting.data?.value)
    snapshot.escalationHours = config.admin_escalation_hours
    const cutoff = new Date(Date.now() - config.admin_escalation_hours * 3_600_000).toISOString()
    const waiting = await looseFrom(admin, 'contact_requests')
      .select('id', { count: 'exact', head: true })
      .not('doctor_id', 'is', null)
      .is('acknowledged_at', null)
      .eq('status', 'new')
      .lt('created_at', cutoff)
    if (waiting.error) throw new Error(waiting.error.message)
    snapshot.leadsWaitingOnDoctors = waiting.count || 0
  } catch (err) {
    console.error('admin today escalation', err instanceof Error ? err.name : 'error')
  }

  let active: Stripe.Subscription[] = []
  let trialing: Stripe.Subscription[] = []
  let pastDue: Stripe.Subscription[] = []
  let unpaid: Stripe.Subscription[] = []
  try {
    ;[active, trialing, pastDue, unpaid] = await Promise.all([
      listSubscriptions('active'),
      listSubscriptions('trialing'),
      listSubscriptions('past_due'),
      listSubscriptions('unpaid'),
    ])
    const byCurrency = new Map<string, number>()
    for (const sub of active) {
      if (sub.status !== 'active') continue
      for (const [currency, minor] of subscriptionMonthlyByCurrency(sub)) {
        byCurrency.set(currency, (byCurrency.get(currency) || 0) + minor)
      }
    }
    snapshot.mrrUsd = majorUnits(byCurrency.get('usd') || 0, 'usd')
    snapshot.mrrOther = [...byCurrency.entries()]
      .filter(([currency]) => currency !== 'usd')
      .map(([currency, minor]) => ({ currency: currency.toUpperCase(), amount: majorUnits(minor, currency) }))
    snapshot.failedSubscriptions = pastDue.length + unpaid.length
    snapshot.failedInvoices30d = await countFailedInvoices()
    snapshot.stripeOk = true
  } catch (err) {
    console.error('admin today stripe', err instanceof Error ? err.name : 'error')
  }

  if (snapshot.membersOk) {
    const activeIds = idSet(active)
    const trialIds = idSet(trialing)
    const pastDueIds = idSet(pastDue)
    const unpaidIds = idSet(unpaid)
    let paying = 0
    let trialingDoctors = 0
    let founding = 0
    let comped = 0
    for (const doctor of doctors) {
      const profile = doctor.user_id ? profileByUser.get(doctor.user_id) : undefined
      const customer = profile?.stripe_customer_id || null
      const live: MembershipStatus | null = customer && activeIds.has(customer)
        ? 'active'
        : customer && trialIds.has(customer)
          ? 'trialing'
          : customer && (pastDueIds.has(customer) || unpaidIds.has(customer))
            ? 'past_due'
            : null
      const stored = doctor.subscription_status
      const stripeStatus = live || (stored && STATUSES.has(stored as MembershipStatus) ? stored as MembershipStatus : null)
      const membership = deriveMembership({
        membershipTier: doctor.membership_tier,
        profileTier: profile?.tier,
        isFoundingMember: doctor.is_founding_member,
        neurosTier: doctor.neuros_tier,
        createdAt: doctor.created_at,
        hasStripeCustomer: Boolean(customer),
        stripeStatus,
      })
      if (snapshot.stripeOk && customer && activeIds.has(customer)) paying += 1
      else if (snapshot.stripeOk && customer && trialIds.has(customer)) trialingDoctors += 1
      else if (membership.source === 'founding') founding += 1
      else if (membership.source === 'comped') comped += 1
    }
    snapshot.paying = snapshot.stripeOk ? paying : null
    snapshot.trialing = snapshot.stripeOk ? trialingDoctors : null
    snapshot.founding = founding
    snapshot.comped = comped
  }

  try {
    const logs = await looseFrom(admin, 'audit_logs')
      .select('id, category, event, user_name, target, created_at')
      .order('created_at', { ascending: false })
      .limit(8)
    if (!logs.error) {
      snapshot.activity = (logs.data || []).map((log) => ({
        id: typeof log.id === 'string' ? log.id : '',
        category: typeof log.category === 'string' ? log.category : 'LOG',
        event: typeof log.event === 'string' ? log.event : 'Event',
        user: typeof log.user_name === 'string' ? log.user_name : 'System',
        target: typeof log.target === 'string' ? log.target : null,
        timestamp: typeof log.created_at === 'string' ? log.created_at : '',
      }))
    }
  } catch (err) {
    console.error('admin today activity', err instanceof Error ? err.name : 'error')
  }

  return snapshot
}

const getCachedAdminToday = unstable_cache(loadAdminTodayUncached, ['admin-today-v1'], {
  revalidate: 600,
  tags: ['admin-today'],
})

export async function adminToday(): Promise<AdminToday> {
  await checkAdminAuth()
  const cached = await getCachedAdminToday()
  const today: AdminToday = { ...cached, mrrOther: [...cached.mrrOther], activity: [...cached.activity] }
  try {
    today.patientRequestsWaiting = await countAttention()
  } catch (err) {
    console.error('admin today attention live', err instanceof Error ? err.name : 'error')
    today.patientRequestsWaiting = null
  }
  return today
}

export async function mrr(): Promise<{ usd: number | null; other: CurrencyAmount[] }> {
  await checkAdminAuth()
  const today = await getCachedAdminToday()
  return { usd: today.mrrUsd, other: today.mrrOther }
}
