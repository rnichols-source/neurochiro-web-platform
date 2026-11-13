import assert from 'node:assert/strict'
import test from 'node:test'
import {
  baselineMrrUsd,
  baselinePayingCount,
  FALLBACK_FX,
  fxFromFrankfurter,
  mergeProducts,
  missingProductIds,
  parseFxOverride,
  summarizeMrr,
  type MrrSub,
  type ProductBits,
} from './mrr-calc.ts'

const NOW = Math.floor(Date.parse('2026-11-13T18:50:00.000Z') / 1000)
const RATES = FALLBACK_FX

const CATALOG: Record<string, ProductBits> = {
  prod_pro: { id: 'prod_pro', name: 'NeuroChiro Pro - Monthly' },
  prod_annual: { id: 'prod_annual', name: 'NeuroChiro Pro - Annual' },
  prod_dir: { id: 'prod_dir', name: 'NeuroChiro Directory Membership' },
  prod_offices: { id: 'prod_offices', name: 'NeuroChiro Membership - 4 Offices' },
  prod_student: { id: 'prod_student', name: 'NeuroChiro Student Membership' },
  prod_ca: { id: 'prod_ca', name: 'NeuroChiro Canada - Founding Member' },
  prod_au: { id: 'prod_au', name: 'NeuroChiro Australia - Founding Member' },
  prod_uk: { id: 'prod_uk', name: 'NeuroChiro UK - Founding Member' },
  prod_berry: { id: 'prod_berry', name: 'Elderberry Syrup 16oz' },
  prod_va: { id: 'prod_va', name: 'VA Letter and DBQ' },
  prod_other: { id: 'prod_other', name: 'Doctor Pro' },
  prod_meta: { id: 'prod_meta', name: 'Featured Associateship Post', metadata: { app: 'neurochiro' } },
}

function sub(partial: MrrSub): MrrSub {
  return { status: 'active', customer: partial.id ? `cus_${partial.id}` : 'cus_1', ...partial }
}

function priceSub(id: string, product: string, unit: number, currency: string, interval: string, count: number, extra: MrrSub = {}): MrrSub {
  return sub({
    id,
    ...extra,
    items: {
      data: [{
        quantity: extra.items?.data?.[0]?.quantity || 1,
        discounts: extra.items?.data?.[0]?.discounts,
        price: { unit_amount: unit, currency, product, recurring: { interval, interval_count: count } },
      }],
    },
  })
}

function run(subs: MrrSub[], extra: { coupons?: Record<string, { percent_off?: number; amount_off?: number; currency?: string; duration?: string; valid?: boolean }>; allowProductIds?: string[] } = {}) {
  return summarizeMrr(subs, { rates: RATES, now: NOW, catalog: CATALOG, ...extra })
}

test('annual price and interval_count both become one twelfth', () => {
  const annual = run([priceSub('a', 'prod_annual', 99000, 'usd', 'year', 1)])
  const counted = run([priceSub('b', 'prod_annual', 99000, 'usd', 'month', 12)])
  assert.equal(annual.mrrUsd, 82.5)
  assert.equal(counted.mrrUsd, 82.5)
  assert.equal(annual.segments.find((row) => row.key === 'doctorAnnual')?.subscriptions, 1)
})

test('interval_count and quantity scale the monthly amount', () => {
  const quarterly = run([priceSub('q', 'prod_pro', 29700, 'usd', 'month', 3)])
  const seats = run([priceSub('s', 'prod_pro', 9900, 'usd', 'month', 1, { items: { data: [{ quantity: 2 }] } })])
  assert.equal(quarterly.mrrUsd, 99)
  assert.equal(seats.mrrUsd, 198)
})

test('percent and amount coupons combine, and 100% off is zero', () => {
  const mixed = run([priceSub('m', 'prod_pro', 10000, 'usd', 'month', 1, {
    discounts: [{ id: 'di_pct', source: { coupon: { percent_off: 10, duration: 'forever' } } }],
    items: { data: [{ discounts: [{ id: 'di_amt', coupon: { amount_off: 500, currency: 'usd', duration: 'repeating' } }] }] },
  })])
  const free = run([priceSub('f', 'prod_pro', 9900, 'usd', 'month', 1, {
    discounts: [{ id: 'di_free', source: { coupon: { percent_off: 100, duration: 'forever' } } }],
  })])
  const stacked = run([priceSub('k', 'prod_pro', 10000, 'usd', 'month', 1, {
    discounts: [{ id: 'di_a', source: { coupon: { percent_off: 50, duration: 'forever' } } }],
    items: { data: [{ discounts: [{ id: 'di_b', source: { coupon: { percent_off: 50, duration: 'forever' } } }] }] },
  })])
  assert.equal(mixed.mrrUsd, 85)
  assert.equal(free.mrrUsd, 0)
  assert.equal(free.payingSubscriptions, 0)
  assert.equal(stacked.mrrUsd, 25)
})

test('expired, once-only, and invalid coupons are skipped', () => {
  const expired = run([priceSub('e', 'prod_pro', 10000, 'usd', 'month', 1, {
    discounts: [{ id: 'di_old', end: NOW - 10, source: { coupon: { percent_off: 100, duration: 'repeating' } } }],
  })])
  const once = run([priceSub('o', 'prod_pro', 10000, 'usd', 'month', 1, {
    discounts: [{ id: 'di_once', source: { coupon: { percent_off: 100, duration: 'once' } } }],
  })])
  const invalid = run([priceSub('v', 'prod_pro', 10000, 'usd', 'month', 1, {
    discounts: [{ id: 'di_bad', source: { coupon: { percent_off: 100, duration: 'forever', valid: false } } }],
  })])
  const annualOff = run([priceSub('y', 'prod_annual', 99000, 'usd', 'year', 1, {
    discounts: [{ id: 'di_year', source: { coupon: { amount_off: 12000, currency: 'usd', duration: 'forever' } } }],
  })])
  assert.equal(expired.mrrUsd, 100)
  assert.equal(once.mrrUsd, 100)
  assert.equal(invalid.mrrUsd, 100)
  assert.equal(annualOff.mrrUsd, 72.5)
})

test('customer, subscription, and item percents multiply', () => {
  const result = run([priceSub('cust', 'prod_pro', 10000, 'usd', 'month', 1, {
    customer: { id: 'cus_c', discount: { id: 'di_cust', source: { coupon: { percent_off: 10, duration: 'forever' } } } },
    discounts: [{ id: 'di_sub', source: { coupon: { percent_off: 10, duration: 'forever' } } }],
    items: { data: [{ discounts: [{ id: 'di_item', source: { coupon: { percent_off: 10, duration: 'forever' } } }] }] },
  })])
  assert.equal(result.mrrUsd, 72.9)
})

test('an archived product missing from the list counts after retrieve fills it in', () => {
  const lone = priceSub('archived', 'prod_UW0OJOXaSsBEIU', 1200, 'usd', 'month', 1)
  const before = run([lone])
  assert.equal(before.mrrUsd, 0)
  assert.equal(before.payingSubscriptions, 0)
  assert.deepEqual(missingProductIds([lone], CATALOG), ['prod_UW0OJOXaSsBEIU'])
  const catalog = mergeProducts(CATALOG, [
    { id: 'prod_UW0OJOXaSsBEIU', name: 'NeuroChiro Student Membership', metadata: {} },
    { id: 'prod_deleted', name: 'NeuroChiro Deleted', deleted: true },
  ])
  const after = summarizeMrr([lone], { rates: RATES, now: NOW, catalog })
  assert.equal(after.mrrUsd, 12)
  assert.equal(after.payingSubscriptions, 1)
  assert.equal(after.segments.find((row) => row.key === 'student')?.subscriptions, 1)
  assert.equal(catalog.prod_deleted, undefined)
})

test('a coupon id on source.coupon is applied from the coupon map', () => {
  const result = run([priceSub('c', 'prod_pro', 9900, 'usd', 'month', 1, {
    discounts: [{ id: 'di_map', source: { coupon: 'coupon_half' } }],
  })], { coupons: { coupon_half: { percent_off: 50, duration: 'forever' } } })
  assert.equal(result.mrrUsd, 49.5)
})

test('foreign prices convert to USD with the fallback table', () => {
  const result = run([
    priceSub('ca', 'prod_ca', 13900, 'cad', 'month', 1),
    priceSub('au', 'prod_au', 12900, 'aud', 'month', 1),
    priceSub('uk', 'prod_uk', 7900, 'gbp', 'month', 1),
  ])
  assert.equal(result.mrrUsd, 289.97)
  assert.equal(result.segments.find((row) => row.key === 'international')?.mrrUsd, 289.97)
  assert.equal(result.rateDate, '2026-11-13')
})

test('scheduled cancels, pauses, past due, and trials stay out of MRR', () => {
  const result = run([
    priceSub('pay', 'prod_pro', 9900, 'usd', 'month', 1),
    priceSub('end', 'prod_pro', 9900, 'usd', 'month', 1, { cancel_at_period_end: true }),
    priceSub('at', 'prod_pro', 9900, 'usd', 'month', 1, { cancel_at: NOW + 86_400 }),
    priceSub('pause', 'prod_pro', 9900, 'usd', 'month', 1, { pause_collection: { behavior: 'void' } }),
    priceSub('late', 'prod_pro', 9900, 'usd', 'month', 1, { status: 'past_due' }),
    priceSub('trial', 'prod_pro', 9900, 'usd', 'month', 1, { status: 'trialing' }),
  ])
  assert.equal(result.mrrUsd, 99)
  assert.equal(result.payingSubscriptions, 1)
  assert.deepEqual(result.scheduled, { amountUsd: 297, count: 3 })
  assert.deepEqual(result.pastDue, { amountUsd: 99, count: 1 })
  assert.deepEqual(result.trialing, { amountUsd: 99, count: 1 })
})

test('non-NeuroChiro products are excluded, including when the price matches a membership', () => {
  const result = run([
    priceSub('berry', 'prod_berry', 9900, 'usd', 'month', 1),
    priceSub('va', 'prod_va', 9900, 'usd', 'month', 1),
    priceSub('lookalike', 'prod_other', 9900, 'usd', 'month', 1),
    priceSub('meta', 'prod_meta', 4900, 'usd', 'month', 1),
    priceSub('pro', 'prod_pro', 9900, 'usd', 'month', 1),
  ], { allowProductIds: ['prod_custom'] })
  const allowed = run([priceSub('custom', 'prod_custom', 1200, 'usd', 'month', 1)], { allowProductIds: ['prod_custom'] })
  assert.equal(result.mrrUsd, 148)
  assert.equal(result.payingSubscriptions, 2)
  assert.equal(allowed.mrrUsd, 12)
  assert.equal(allowed.segments.find((row) => row.key === 'student')?.mrrUsd, 0)
  assert.equal(allowed.segments.find((row) => row.key === 'doctorMonthly')?.mrrUsd, 12)
})

test('two subscriptions for one customer count once as a customer', () => {
  const result = run([
    priceSub('one', 'prod_pro', 9900, 'usd', 'month', 1, { customer: 'cus_same' }),
    priceSub('two', 'prod_student', 1200, 'usd', 'month', 1, { customer: 'cus_same' }),
  ])
  assert.equal(result.payingSubscriptions, 2)
  assert.equal(result.payingCustomers, 1)
  assert.equal(result.segments.find((row) => row.key === 'student')?.subscriptions, 1)
})

test('the 13 Nov 2026 Stripe book is $7,085.09 from 132 paying subscriptions', () => {
  const subs: MrrSub[] = []
  const add = (product: string, unit: number, currency: string, interval: string, count: number, n: number) => {
    for (let i = 0; i < n; i += 1) subs.push(priceSub(`${product}-${unit}-${subs.length}`, product, unit, currency, interval, count))
  }
  add('prod_dir', 29700, 'usd', 'month', 12, 32)
  add('prod_dir', 3900, 'usd', 'month', 1, 10)
  add('prod_dir', 39700, 'usd', 'month', 12, 22)
  add('prod_dir', 2900, 'usd', 'month', 1, 19)
  add('prod_dir', 5587, 'usd', 'month', 1, 1)
  add('prod_dir', 5500, 'usd', 'month', 1, 1)
  add('prod_dir', 55000, 'usd', 'month', 12, 1)
  add('prod_dir', 39700, 'usd', 'year', 1, 1)
  add('prod_dir', 0, 'usd', 'month', 1, 5)
  add('prod_dir', 0, 'usd', 'year', 1, 1)
  add('prod_pro', 9900, 'usd', 'month', 1, 31)
  add('prod_annual', 99000, 'usd', 'month', 12, 8)
  add('prod_ca', 13900, 'cad', 'month', 1, 2)
  add('prod_au', 12900, 'aud', 'month', 1, 1)
  add('prod_uk', 7900, 'gbp', 'month', 1, 1)
  add('prod_offices', 30600, 'usd', 'month', 1, 1)
  add('prod_student', 1200, 'usd', 'month', 1, 1)
  subs.push(priceSub('noise', 'prod_berry', 19900, 'usd', 'month', 1))
  const result = run(subs)
  assert.equal(subs.length, 139)
  assert.equal(result.payingSubscriptions, 132)
  assert.equal(result.payingCustomers, 132)
  assert.equal(result.mrrUsd, 7085.09)
  const segment = (key: string) => result.segments.find((row) => row.key === key)
  assert.equal(segment('doctorMonthly')?.mrrUsd, 3069)
  assert.equal(segment('doctorMonthly')?.subscriptions, 31)
  assert.equal(segment('doctorAnnual')?.mrrUsd, 660)
  assert.equal(segment('doctorAnnual')?.subscriptions, 8)
  assert.equal(segment('international')?.mrrUsd, 387.47)
  assert.equal(segment('international')?.subscriptions, 4)
  assert.equal(segment('multiOffice')?.mrrUsd, 306)
  assert.equal(segment('legacyDirectory')?.mrrUsd, 2650.62)
  assert.equal(segment('legacyDirectory')?.subscriptions, 87)
  assert.equal(segment('student')?.mrrUsd, 12)
})

test('the revenue baseline leaves out past_due and trialing', () => {
  const subs = [
    priceSub('live', 'prod_pro', 9900, 'usd', 'month', 1, { created: NOW - 86_400 * 40, status: 'active' }),
    priceSub('late', 'prod_pro', 9900, 'usd', 'month', 1, { created: NOW - 86_400 * 40, status: 'past_due' }),
    priceSub('trial', 'prod_pro', 9900, 'usd', 'month', 1, { created: NOW - 86_400 * 40, status: 'trialing' }),
    priceSub('gone', 'prod_pro', 9900, 'usd', 'month', 1, { created: NOW - 86_400 * 40, status: 'canceled', canceled_at: NOW - 10 }),
    priceSub('berry', 'prod_berry', 5000, 'usd', 'month', 1, { created: NOW - 86_400 * 40, status: 'active' }),
  ]
  const options = { rates: RATES, now: NOW, catalog: CATALOG }
  assert.equal(baselineMrrUsd(subs, NOW - 86_400 * 20, options), 198)
  assert.equal(baselinePayingCount(subs, NOW - 86_400 * 20, options), 2)
  assert.equal(baselineMrrUsd(subs, NOW, options), 99)
})

test('FX override and Frankfurter payloads become a rate table', () => {
  const override = parseFxOverride('{"date":"2026-11-01","CAD":1.4,"GBP":0.8}', '2026-11-13')
  assert.equal(override?.date, '2026-11-01')
  assert.equal(override?.perUsd.CAD, 1.4)
  assert.equal(override?.perUsd.USD, 1)
  assert.equal(parseFxOverride('not json', '2026-11-13'), null)
  const live = fxFromFrankfurter({ date: '2026-11-12', rates: { CAD: 1.41, AUD: 1.5, GBP: 0.76 } })
  assert.equal(live?.date, '2026-11-12')
  assert.equal(live?.perUsd.CAD, 1.41)
  assert.equal(live?.perUsd.USD, 1)
})
