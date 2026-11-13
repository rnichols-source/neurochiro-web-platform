import 'server-only'

import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import {
  couponIdsIn,
  failedSnapshot,
  FALLBACK_FX,
  fxFromFrankfurter,
  parseFxOverride,
  summarizeMrr,
  type CouponBits,
  type FxTable,
  type MrrSnapshot,
  type MrrSub,
  type ProductBits,
} from './mrr-calc'

export type { MrrSnapshot, SegmentRow } from './mrr-calc'
export { baselineMrrUsd, baselinePayingCount, summarizeMrr } from './mrr-calc'

const TTL_MS = 180_000
const FX_URL = 'https://api.frankfurter.dev/v1/latest?from=USD&to=CAD,AUD,GBP,NZD,EUR'
const FULL_EXPAND = ['data.discounts.source.coupon', 'data.items.data.discounts.source.coupon', 'data.customer']
const SHORT_EXPAND = ['data.discounts.source.coupon', 'data.items.data.discounts', 'data.customer']
const EXTRA_STATUSES = ['past_due', 'trialing', 'unpaid', 'paused'] as const

type Memo = {
  at: number
  snapshot: MrrSnapshot
  rates: FxTable
  catalog: Record<string, ProductBits>
}

let memo: Memo | null = null
let pending: Promise<MrrSnapshot> | null = null
let fxMemo: { day: string; table: FxTable } | null = null

function expandTooDeep(err: unknown): boolean {
  const message = err instanceof Error ? err.message : ''
  return /expand more than 4 levels/i.test(message)
}

function allowProductIds(env: NodeJS.ProcessEnv): string[] {
  return (env.NEUROCHIRO_PRODUCT_IDS || '')
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter((id) => id.startsWith('prod_'))
}

export async function loadFxTable(env: NodeJS.ProcessEnv = process.env): Promise<FxTable> {
  const today = new Date().toISOString().slice(0, 10)
  const override = parseFxOverride(env.MRR_FX_RATES, today)
  if (override) return override
  if (fxMemo?.day === today) return fxMemo.table
  try {
    const response = await fetch(FX_URL, { cache: 'no-store' })
    if (!response.ok) return FALLBACK_FX
    const table = fxFromFrankfurter(await response.json())
    if (!table) return FALLBACK_FX
    fxMemo = { day: today, table }
    return table
  } catch {
    return FALLBACK_FX
  }
}

async function listStatus(status: Stripe.SubscriptionListParams['status'], expand: string[]): Promise<MrrSub[]> {
  const out: MrrSub[] = []
  const params = { status, limit: 100, expand } as Stripe.SubscriptionListParams
  for await (const sub of stripe.subscriptions.list(params)) out.push(sub as unknown as MrrSub)
  return out
}

async function listSubscriptions(): Promise<MrrSub[]> {
  let expand = FULL_EXPAND
  let active: MrrSub[]
  try {
    active = await listStatus('active', expand)
  } catch (err) {
    if (!expandTooDeep(err)) throw err
    expand = SHORT_EXPAND
    active = await listStatus('active', expand)
  }
  const rest = await Promise.all(EXTRA_STATUSES.map((status) => listStatus(status, expand)))
  return [active, ...rest].flat()
}

async function loadCatalog(): Promise<Record<string, ProductBits>> {
  const catalog: Record<string, ProductBits> = {}
  for (const active of [true, false]) {
    for await (const product of stripe.products.list({ active, limit: 100 })) {
      catalog[product.id] = { id: product.id, name: product.name, metadata: product.metadata || {} }
    }
  }
  return catalog
}

async function loadCoupons(ids: string[]): Promise<Record<string, CouponBits>> {
  const coupons: Record<string, CouponBits> = {}
  await Promise.all(ids.map(async (id) => {
    try {
      const coupon = await stripe.coupons.retrieve(id)
      coupons[id] = {
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        valid: coupon.valid,
      }
    } catch {
      // An unreadable coupon is left off. The subscription price still counts.
    }
  }))
  return coupons
}

async function compute(): Promise<Memo> {
  const ratesPromise = loadFxTable()
  const catalogPromise = loadCatalog()
  const subs = await listSubscriptions()
  const couponIds = [...new Set(subs.flatMap((sub) => couponIdsIn(sub)))]
  const [rates, catalog, coupons] = await Promise.all([ratesPromise, catalogPromise, loadCoupons(couponIds)])
  const math = summarizeMrr(subs, {
    rates,
    catalog,
    coupons,
    allowProductIds: allowProductIds(process.env),
  })
  return {
    at: Date.now(),
    rates,
    catalog,
    snapshot: { ok: true, ...math },
  }
}

/** Live NeuroChiro MRR from Stripe. Read-only. Cached for about three minutes. */
export function loadNeuroChiroMrr(): Promise<MrrSnapshot> {
  if (memo && Date.now() - memo.at < TTL_MS) return Promise.resolve(memo.snapshot)
  if (!pending) {
    pending = compute()
      .then((next) => {
        memo = next
        return next.snapshot
      })
      .catch((err: unknown) => {
        console.error('neurochiro mrr', err instanceof Error ? err.name : 'error')
        return failedSnapshot()
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

/** Rates and product names from the same read the MRR card uses. */
export async function loadMrrBaselineInputs(): Promise<{ rates: FxTable; catalog: Record<string, ProductBits> }> {
  if (!memo || Date.now() - memo.at >= TTL_MS) await loadNeuroChiroMrr()
  if (memo && Date.now() - memo.at < TTL_MS) return { rates: memo.rates, catalog: memo.catalog }
  return { rates: FALLBACK_FX, catalog: {} }
}
