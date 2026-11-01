import assert from 'node:assert/strict'
import test from 'node:test'
import { categoryKeyFromAlias, SYNAPSE_CATEGORIES } from './categories.ts'
import { anchorCheckoutPlan, anchorFeeCents } from './fees.ts'
import { priceMismatch } from './price-check.ts'
import { proofScore, seatHoldsCategory } from './seats.ts'
import { suppressSmallBuckets } from './anonymity.ts'
import { disclosureText, socialDisclosure } from './disclosure.ts'
import { paybackProgress, savedThisYearCents } from './savings.ts'

test('anchor fee is the greater of the floor and rate times members', () => {
  assert.equal(anchorFeeCents({ categoryClass: 'core', members: 10, founding: false, inFirstYear: false }), 600_000)
  assert.equal(anchorFeeCents({ categoryClass: 'core', members: 200, founding: false, inFirstYear: false }), 1_200_000)
  assert.equal(anchorFeeCents({ categoryClass: 'standard', members: 10, founding: false, inFirstYear: false }), 300_000)
  assert.equal(anchorFeeCents({ categoryClass: 'standard', members: 200, founding: false, inFirstYear: false }), 600_000)
})

test('founding year 1 is the floor and later years cap the increase at 25 percent', () => {
  assert.equal(anchorFeeCents({ categoryClass: 'core', members: 500, founding: true, inFirstYear: true }), 600_000)
  assert.equal(anchorFeeCents({
    categoryClass: 'core',
    members: 500,
    founding: true,
    inFirstYear: false,
    previousFeeCents: 600_000,
  }), 750_000)
})

test('checkout uses the floor price unless the per-member total is higher', () => {
  const floor = anchorCheckoutPlan({ categoryClass: 'core', members: 40, founding: false, inFirstYear: false })
  assert.equal(floor.priceEnv, 'floor')
  assert.equal(floor.quantity, 1)
  const variable = anchorCheckoutPlan({ categoryClass: 'core', members: 200, founding: false, inFirstYear: false })
  assert.equal(variable.priceEnv, 'per_member')
  assert.equal(variable.quantity, 200)
  const founding = anchorCheckoutPlan({ categoryClass: 'core', members: 200, founding: true, inFirstYear: true })
  assert.equal(founding.priceEnv, 'floor')
  assert.equal(founding.feeCents, 600_000)
})

test('both legacy category lists map onto one key list', () => {
  const legacy = [
    'Tables & Equipment', 'Imaging & Scans', 'EHR & Software', 'Marketing', 'Supplements',
    'Education & Coaching', 'Billing & Collections', 'Legal & Compliance', 'Office Supplies & Design',
    'Staffing & HR', 'Financial Services', 'Real Estate',
    'Supplements & Nutrition', 'Scanning Technology', 'Practice Management Software',
    'Chiropractic Tables & Equipment', 'Orthotics & Supports', 'Education & Training',
    'Marketing & Branding', 'Office Supplies & Décor', 'Billing & Insurance', 'Patient Engagement',
    'Apparel & Merchandise',
  ]
  for (const label of legacy) {
    const key = categoryKeyFromAlias(label)
    assert.ok(key, label)
    assert.ok(SYNAPSE_CATEGORIES.some((category) => category.key === key))
  }
  assert.equal(categoryKeyFromAlias('Other'), null)
  assert.equal(categoryKeyFromAlias('neuro-scanning'), 'neuro-scanning')
  assert.equal(new Set(SYNAPSE_CATEGORIES.map((category) => category.key)).size, SYNAPSE_CATEGORIES.length)
})

test('an expired reservation does not hold the anchor seat', () => {
  const now = new Date('2026-11-01T12:00:00Z')
  assert.equal(seatHoldsCategory({ tier: 'anchor', status: 'pending_payment', reservedUntil: '2026-11-02T00:00:00Z' }, now), true)
  assert.equal(seatHoldsCategory({ tier: 'anchor', status: 'pending_payment', reservedUntil: '2026-10-01T00:00:00Z' }, now), false)
  assert.equal(seatHoldsCategory({ tier: 'anchor', status: 'lapsed', reservedUntil: null }, now), false)
  assert.equal(seatHoldsCategory({ tier: 'anchor', status: 'active', reservedUntil: null }, now), true)
  assert.equal(seatHoldsCategory({ tier: 'ally', status: 'active', reservedUntil: null }, now), false)
})

test('proof score thresholds never revoke', () => {
  const now = new Date('2026-11-01T00:00:00Z')
  const few = Array.from({ length: 4 }, () => ({ rating: 5, createdAt: '2026-10-01T00:00:00Z' }))
  assert.equal(proofScore(few, now).flag, 'insufficient')
  const strong = Array.from({ length: 5 }, () => ({ rating: 5, createdAt: '2026-10-15T00:00:00Z' }))
  assert.equal(proofScore(strong, now).flag, 'ok')
  const soft = Array.from({ length: 5 }, () => ({ rating: 4.2, createdAt: '2026-10-15T00:00:00Z' }))
  assert.equal(proofScore(soft, now).flag, 'at_risk')
  const older = Array.from({ length: 3 }, () => ({ rating: 3, createdAt: '2026-06-01T00:00:00Z' }))
  const newer = Array.from({ length: 3 }, () => ({ rating: 3, createdAt: '2026-10-01T00:00:00Z' }))
  const review = proofScore([...older, ...newer], now)
  assert.equal(review.flag, 'review')
  assert.notEqual(review.flag, 'revoked')
})

test('a stripe price that does not match the config is refused', () => {
  assert.equal(priceMismatch({ unit_amount: 600_000, currency: 'usd', recurring: { interval: 'year' } }, { unitAmount: 600_000, interval: 'year' }), null)
  assert.match(priceMismatch({ unit_amount: 9900, currency: 'usd', recurring: { interval: 'month' } }, { unitAmount: 600_000, interval: 'year' }) || '', /amount/)
  assert.match(priceMismatch({ unit_amount: 50_000, currency: 'usd', recurring: { interval: 'year' } }, { unitAmount: 50_000, interval: null }) || '', /interval/)
})

test('buckets under 10 are suppressed', () => {
  const rows = suppressSmallBuckets([{ key: 'SC', count: 9 }, { key: 'TX', count: 12 }])
  assert.equal(rows[0].label, '<10')
  assert.equal(rows[0].count, null)
  assert.equal(rows[1].count, 12)
})

test('saved this year sums the calendar year against the membership goal', () => {
  const cents = savedThisYearCents([
    { amountSavedCents: 50_000, createdAt: '2026-02-01T00:00:00Z' },
    { amountSavedCents: 10_000, createdAt: '2025-12-01T00:00:00Z' },
    { amountSavedCents: -5, createdAt: '2026-03-01T00:00:00Z' },
  ], 2026)
  assert.equal(cents, 50_000)
  assert.equal(paybackProgress(99_000).reached, true)
  assert.equal(paybackProgress(10).reached, false)
})

test('disclosure copy names the paid relationship', () => {
  assert.match(disclosureText('anchor'), /Synapse Anchor/)
  assert.match(disclosureText('ally'), /Synapse Ally/)
  assert.equal(disclosureText('sponsored'), 'Sponsored · Paid partnership with NeuroChiro')
  assert.equal(disclosureText('proof-panel'), 'Doctors in this panel received product at no cost.')
  assert.equal(socialDisclosure('Northstar'), 'Paid partnership: Northstar × NeuroChiro · neurochiro.co')
})
