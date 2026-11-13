/**
 * Pure NeuroChiro MRR math. Stripe listing and FX fetch live in mrr.ts.
 * Amounts stay in minor units until the currency conversion, then round once.
 */

export const FALLBACK_FX_DATE = '2026-11-13'

/** Foreign currency units per 1 USD on 13 Nov 2026. */
export const FALLBACK_FX_PER_USD: Record<string, number> = {
  USD: 1,
  CAD: 1.42563,
  AUD: 1.468309,
  GBP: 0.755149,
}

const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'])

export type FxTable = {
  date: string
  /** Foreign units per 1 USD. USD is 1. */
  perUsd: Record<string, number>
}

export const FALLBACK_FX: FxTable = {
  date: FALLBACK_FX_DATE,
  perUsd: { ...FALLBACK_FX_PER_USD },
}

export type CouponBits = {
  percent_off?: number | null
  amount_off?: number | null
  currency?: string | null
  duration?: string | null
  valid?: boolean | null
}

export type DiscountBits = {
  id?: string
  end?: number | null
  coupon?: CouponBits | string | null
  source?: { coupon?: CouponBits | string | null } | null
}

export type ProductBits = {
  id?: string
  name?: string | null
  metadata?: Record<string, string> | null
}

export type PriceBits = {
  currency?: string | null
  unit_amount?: number | null
  product?: string | ProductBits | null
  recurring?: { interval?: string | null; interval_count?: number | null } | null
}

export type ItemBits = {
  quantity?: number | null
  discounts?: unknown
  price?: PriceBits | null
}

export type CustomerBits = {
  id?: string
  deleted?: boolean
  discount?: unknown
  discounts?: unknown
}

export type MrrSub = {
  id?: string
  status?: string | null
  created?: number | null
  canceled_at?: number | null
  cancel_at_period_end?: boolean | null
  cancel_at?: number | null
  pause_collection?: unknown
  customer?: string | CustomerBits | null
  discount?: unknown
  discounts?: unknown
  items?: { data?: ItemBits[] | null } | null
}

export type SegmentKey = 'doctorMonthly' | 'doctorAnnual' | 'international' | 'multiOffice' | 'legacyDirectory' | 'student'

export type SegmentRow = {
  key: SegmentKey
  label: string
  mrrUsd: number
  subscriptions: number
}

export type MoneyCount = { amountUsd: number; count: number }

export type MrrMath = {
  mrrUsd: number
  segments: SegmentRow[]
  payingSubscriptions: number
  payingCustomers: number
  pastDue: MoneyCount
  trialing: MoneyCount
  scheduled: MoneyCount
  rateDate: string
}

export type MrrSnapshot = {
  ok: boolean
  mrrUsd: number | null
  segments: SegmentRow[]
  payingSubscriptions: number | null
  payingCustomers: number | null
  pastDue: MoneyCount
  trialing: MoneyCount
  scheduled: MoneyCount
  rateDate: string | null
}

export function failedSnapshot(): MrrSnapshot {
  return {
    ok: false,
    mrrUsd: null,
    segments: SEGMENT_DEFS.map((def) => ({ key: def.key, label: def.label, mrrUsd: 0, subscriptions: 0 })),
    payingSubscriptions: null,
    payingCustomers: null,
    pastDue: { amountUsd: 0, count: 0 },
    trialing: { amountUsd: 0, count: 0 },
    scheduled: { amountUsd: 0, count: 0 },
    rateDate: null,
  }
}

export const SEGMENT_DEFS: { key: SegmentKey; label: string }[] = [
  { key: 'doctorMonthly', label: 'Doctor monthly' },
  { key: 'doctorAnnual', label: 'Doctor annual' },
  { key: 'international', label: 'International' },
  { key: 'multiOffice', label: 'Multi-office' },
  { key: 'legacyDirectory', label: 'Legacy directory' },
  { key: 'student', label: 'Student' },
]

export type SummarizeOptions = {
  rates: FxTable
  now?: number
  catalog?: Record<string, ProductBits>
  allowProductIds?: Iterable<string>
  coupons?: Record<string, CouponBits>
}

const EXCLUDED_NAME = /elderberry|va letter|va nexus/i
const BASELINE_SKIP = new Set(['past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'])

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function monthlyMinor(unitAmount: number, quantity: number, interval: string, intervalCount: number): number {
  const amount = unitAmount * (quantity || 1)
  const count = intervalCount || 1
  if (interval === 'month') return amount / count
  if (interval === 'year') return amount / (count * 12)
  if (interval === 'week') return (amount * 52) / (count * 12)
  if (interval === 'day') return (amount * 365) / (count * 12)
  return 0
}

export function parseFxOverride(raw: string | undefined, today: string): FxTable | null {
  if (!raw?.trim()) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const record = parsed as Record<string, unknown>
  const perUsd: Record<string, number> = { USD: 1 }
  for (const [key, value] of Object.entries(record)) {
    if (key === 'date') continue
    const code = key.toUpperCase()
    const num = typeof value === 'number' ? value : Number(value)
    if (code.length === 3 && Number.isFinite(num) && num > 0) perUsd[code] = num
  }
  if (Object.keys(perUsd).length < 2) return null
  const date = typeof record.date === 'string' && record.date.trim() ? record.date.trim() : today
  return { date, perUsd }
}

export function fxFromFrankfurter(body: unknown): FxTable | null {
  if (!body || typeof body !== 'object') return null
  const record = body as { date?: unknown; rates?: unknown }
  if (!record.rates || typeof record.rates !== 'object') return null
  const perUsd: Record<string, number> = { ...FALLBACK_FX_PER_USD }
  for (const [key, value] of Object.entries(record.rates as Record<string, unknown>)) {
    const num = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(num) && num > 0) perUsd[key.toUpperCase()] = num
  }
  const date = typeof record.date === 'string' && record.date ? record.date : FALLBACK_FX_DATE
  return { date, perUsd }
}

export function minorToUsd(minor: number, currency: string, rates: FxTable): number {
  const code = (currency || 'usd').toUpperCase()
  const perUsd = code === 'USD' ? 1 : rates.perUsd[code]
  if (!perUsd || perUsd <= 0) return 0
  const divisor = ZERO_DECIMAL.has(code.toLowerCase()) ? 1 : 100
  return (minor / divisor) / perUsd
}

export function isNeuroChiroProduct(product: ProductBits | null | undefined, allow: Set<string> = new Set()): boolean {
  if (!product) return false
  const name = product.name || ''
  if (EXCLUDED_NAME.test(name)) return false
  if (name.trim().toLowerCase().startsWith('neurochiro')) return true
  if (product.id && allow.has(product.id)) return true
  for (const [key, value] of Object.entries(product.metadata || {})) {
    if (`${key} ${value}`.toLowerCase().includes('neurochiro')) return true
  }
  return false
}

export function classifySegment(product: ProductBits, currency: string, interval: string, intervalCount: number): SegmentKey {
  const name = (product.name || '').toLowerCase()
  const meta = Object.entries(product.metadata || {}).map(([key, value]) => `${key} ${value}`).join(' ').toLowerCase()
  if ((currency || 'usd').toLowerCase() !== 'usd') return 'international'
  if (name.includes('student') || meta.includes('student')) return 'student'
  if (name.includes('office') || meta.includes('multi-office') || meta.includes('multi_office')) return 'multiOffice'
  if (name.includes('directory') || meta.includes('directory')) return 'legacyDirectory'
  const annual = interval === 'year' || (interval === 'month' && intervalCount >= 12) || name.includes('annual')
  return annual ? 'doctorAnnual' : 'doctorMonthly'
}

function asList(value: unknown): DiscountBits[] {
  if (Array.isArray(value)) return value.filter((entry): entry is DiscountBits => Boolean(entry) && typeof entry === 'object')
  if (value && typeof value === 'object') return [value as DiscountBits]
  return []
}

function couponOf(discount: DiscountBits, coupons: Record<string, CouponBits>): CouponBits | null {
  const raw = discount.source?.coupon ?? discount.coupon
  if (!raw) return null
  if (typeof raw === 'string') return coupons[raw] || null
  return raw
}

function activeCoupons(discounts: DiscountBits[], coupons: Record<string, CouponBits>, now: number): CouponBits[] {
  const out: CouponBits[] = []
  const seen = new Set<string>()
  for (const discount of discounts) {
    const id = discount.id || ''
    if (id && seen.has(id)) continue
    if (id) seen.add(id)
    const coupon = couponOf(discount, coupons)
    if (!coupon) continue
    if (coupon.duration === 'once') continue
    if (coupon.valid === false) continue
    if (typeof discount.end === 'number' && discount.end <= now) continue
    out.push(coupon)
  }
  return out
}

function percentFactor(coupons: CouponBits[]): number {
  let factor = 1
  for (const coupon of coupons) {
    if (typeof coupon.percent_off === 'number' && coupon.percent_off > 0) {
      factor *= 1 - coupon.percent_off / 100
    }
  }
  return Math.max(0, factor)
}

export function productIdsIn(subs: MrrSub[]): string[] {
  const ids = new Set<string>()
  for (const sub of subs) {
    for (const item of sub.items?.data || []) {
      const product = item.price?.product
      if (typeof product === 'string' && product) ids.add(product)
      else if (product && typeof product === 'object' && product.id) ids.add(product.id)
    }
  }
  return [...ids]
}

/** Product ids on subscriptions that products.list did not return. */
export function missingProductIds(subs: MrrSub[], catalog: Record<string, ProductBits>): string[] {
  return productIdsIn(subs).filter((id) => !catalog[id])
}

export function mergeProducts(
  catalog: Record<string, ProductBits>,
  products: Array<ProductBits & { deleted?: boolean }>,
): Record<string, ProductBits> {
  const next = { ...catalog }
  for (const product of products) {
    if (!product?.id || product.deleted) continue
    next[product.id] = { id: product.id, name: product.name || '', metadata: product.metadata || {} }
  }
  return next
}

export function couponIdsIn(sub: MrrSub): string[] {
  const ids: string[] = []
  const take = (discount: DiscountBits) => {
    const raw = discount.source?.coupon ?? discount.coupon
    if (typeof raw === 'string' && raw) ids.push(raw)
  }
  for (const discount of asList(sub.discounts)) take(discount)
  for (const discount of asList(sub.discount)) take(discount)
  for (const item of sub.items?.data || []) {
    for (const discount of asList(item.discounts)) take(discount)
  }
  const customer = sub.customer
  if (customer && typeof customer === 'object' && !customer.deleted) {
    for (const discount of asList(customer.discount)) take(discount)
    for (const discount of asList(customer.discounts)) take(discount)
  }
  return ids
}

function resolveProduct(price: PriceBits, catalog: Record<string, ProductBits>): ProductBits | null {
  const product = price.product
  if (!product) return null
  if (typeof product === 'string') {
    const known = catalog[product]
    return { id: product, name: known?.name || '', metadata: known?.metadata || {} }
  }
  const id = product.id || ''
  const known = id ? catalog[id] : undefined
  return {
    id,
    name: product.name || known?.name || '',
    metadata: product.metadata || known?.metadata || {},
  }
}

type Line = {
  currency: string
  monthlyMinor: number
  segment: SegmentKey
  interval: string
  intervalCount: number
}

type Contribution = {
  hasProduct: boolean
  usd: number
  segment: SegmentKey | null
}

function subscriptionScopeDiscounts(sub: MrrSub): DiscountBits[] {
  const customer = sub.customer
  const customerDiscounts = customer && typeof customer === 'object' && !customer.deleted
    ? [...asList(customer.discount), ...asList(customer.discounts)]
    : []
  return [...asList(sub.discounts), ...asList(sub.discount), ...customerDiscounts]
}

function contribute(sub: MrrSub, options: Required<Pick<SummarizeOptions, 'rates' | 'now'>> & SummarizeOptions): Contribution {
  const catalog = options.catalog || {}
  const allow = new Set(options.allowProductIds || [])
  const coupons = options.coupons || {}
  const scope = activeCoupons(subscriptionScopeDiscounts(sub), coupons, options.now)
  const scopeFactor = percentFactor(scope)
  const lines: Line[] = []
  for (const item of sub.items?.data || []) {
    const price = item.price
    const recurring = price?.recurring
    if (!price || !recurring?.interval || price.unit_amount == null) continue
    const product = resolveProduct(price, catalog)
    if (!isNeuroChiroProduct(product, allow)) continue
    const interval = recurring.interval
    const intervalCount = recurring.interval_count || 1
    const itemFactor = percentFactor(activeCoupons(asList(item.discounts), coupons, options.now)) * scopeFactor
    const monthly = monthlyMinor(price.unit_amount, item.quantity || 1, interval, intervalCount) * itemFactor
    lines.push({
      currency: (price.currency || 'usd').toLowerCase(),
      monthlyMinor: monthly,
      segment: classifySegment(product || {}, price.currency || 'usd', interval, intervalCount),
      interval,
      intervalCount,
    })
  }
  if (!lines.length) return { hasProduct: false, usd: 0, segment: null }
  const buckets = new Map<string, number>()
  let top = lines[0]
  for (const line of lines) {
    buckets.set(line.currency, (buckets.get(line.currency) || 0) + line.monthlyMinor)
    if (minorToUsd(line.monthlyMinor, line.currency, options.rates) > minorToUsd(top.monthlyMinor, top.currency, options.rates)) top = line
  }
  const amountOffs = [
    ...scope.map((coupon) => ({ coupon, interval: top.interval, intervalCount: top.intervalCount })),
    ...(sub.items?.data || []).flatMap((item) => {
      const recurring = item.price?.recurring
      if (!recurring?.interval) return []
      const product = item.price ? resolveProduct(item.price, catalog) : null
      if (!isNeuroChiroProduct(product, allow)) return []
      return activeCoupons(asList(item.discounts), coupons, options.now).map((coupon) => ({
        coupon,
        interval: recurring.interval || 'month',
        intervalCount: recurring.interval_count || 1,
      }))
    }),
  ]
  const primaryCurrency = top.currency
  for (const off of amountOffs) {
    if (typeof off.coupon.amount_off !== 'number' || off.coupon.amount_off <= 0) continue
    const currency = (off.coupon.currency || primaryCurrency).toLowerCase()
    const monthlyOff = monthlyMinor(off.coupon.amount_off, 1, off.interval, off.intervalCount)
    buckets.set(currency, Math.max(0, (buckets.get(currency) || 0) - monthlyOff))
  }
  let usd = 0
  for (const [currency, minor] of buckets) usd += minorToUsd(minor, currency, options.rates)
  return { hasProduct: true, usd, segment: top.segment }
}

function bucketOf(sub: MrrSub): 'mrr' | 'pastDue' | 'trialing' | 'scheduled' | 'ignore' {
  const status = sub.status || ''
  if (status === 'trialing') return 'trialing'
  if (status === 'past_due' || status === 'unpaid') return 'pastDue'
  if (status === 'paused' || sub.pause_collection || sub.cancel_at_period_end || typeof sub.cancel_at === 'number') return 'scheduled'
  if (status === 'active') return 'mrr'
  return 'ignore'
}

function customerKey(sub: MrrSub): string | null {
  const customer = sub.customer
  if (typeof customer === 'string') return customer
  if (customer && typeof customer === 'object' && !customer.deleted && customer.id) return customer.id
  return null
}

export function summarizeMrr(subs: MrrSub[], options: SummarizeOptions): MrrMath {
  const now = options.now ?? Math.floor(Date.now() / 1000)
  const ready = { ...options, now }
  const segments = new Map<SegmentKey, { mrrUsd: number; subscriptions: number }>()
  for (const def of SEGMENT_DEFS) segments.set(def.key, { mrrUsd: 0, subscriptions: 0 })
  const totals = { mrr: 0, pastDue: 0, trialing: 0, scheduled: 0 }
  const counts = { pastDue: 0, trialing: 0, scheduled: 0 }
  const customers = new Set<string>()
  let payingSubscriptions = 0
  for (const sub of subs) {
    const contribution = contribute(sub, ready)
    if (!contribution.hasProduct) continue
    const bucket = bucketOf(sub)
    if (bucket === 'ignore') continue
    totals[bucket] += contribution.usd
    if (bucket !== 'mrr') counts[bucket] += 1
    if (bucket === 'mrr' && contribution.usd > 0.005) {
      payingSubscriptions += 1
      const id = customerKey(sub)
      if (id) customers.add(id)
      if (contribution.segment) {
        const row = segments.get(contribution.segment)!
        row.mrrUsd += contribution.usd
        row.subscriptions += 1
      }
    }
  }
  return {
    mrrUsd: roundMoney(totals.mrr),
    segments: SEGMENT_DEFS.map((def) => {
      const row = segments.get(def.key)!
      return { key: def.key, label: def.label, mrrUsd: roundMoney(row.mrrUsd), subscriptions: row.subscriptions }
    }),
    payingSubscriptions,
    payingCustomers: customers.size,
    pastDue: { amountUsd: roundMoney(totals.pastDue), count: counts.pastDue },
    trialing: { amountUsd: roundMoney(totals.trialing), count: counts.trialing },
    scheduled: { amountUsd: roundMoney(totals.scheduled), count: counts.scheduled },
    rateDate: options.rates.date,
  }
}

export function includedInBaseline(sub: MrrSub, timestamp: number): boolean {
  const status = sub.status || ''
  if (BASELINE_SKIP.has(status)) return false
  if ((sub.created || 0) > timestamp) return false
  if (typeof sub.canceled_at === 'number' && sub.canceled_at <= timestamp) return false
  return status === 'active' || status === 'canceled'
}

export function recognizedMonthlyUsd(sub: MrrSub, options: SummarizeOptions): number {
  const now = options.now ?? Math.floor(Date.now() / 1000)
  return contribute({ ...sub, status: 'active', cancel_at: null, cancel_at_period_end: false, pause_collection: null }, { ...options, now }).usd
}

export function baselineMrrUsd(subs: MrrSub[], timestamp: number, options: SummarizeOptions): number {
  let total = 0
  for (const sub of subs) {
    if (!includedInBaseline(sub, timestamp)) continue
    total += recognizedMonthlyUsd(sub, options)
  }
  return roundMoney(total)
}

export function baselinePayingCount(subs: MrrSub[], timestamp: number, options: SummarizeOptions): number {
  let count = 0
  for (const sub of subs) {
    if (!includedInBaseline(sub, timestamp)) continue
    if (recognizedMonthlyUsd(sub, options) > 0.005) count += 1
  }
  return count
}
