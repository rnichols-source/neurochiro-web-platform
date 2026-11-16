/**
 * Doctor-membership products on the live Stripe account (Aligned Ventures).
 * Inspected read-only on 16 Nov 2026. Do not create or edit these objects from code.
 *
 * Recognition order is: product or price metadata, then this id list (plus
 * STRIPE_DOCTOR_MEMBERSHIP_PRODUCT_IDS), then the product name, then the amount
 * fallback in plan.ts. Student products are excluded by name and metadata.
 *
 * Pro monthly prod_VHErgcWaKV4LZe
 *   price_1UGgOFQ4WJOENoxrd8vdS7Yu USD 9900 / month
 *   price_1UYy7dQ4WJOENoxrzRmWIgKE USD 19900 / month, metadata effective=2026-12-01
 *   price_1UYc3fQ4WJOENoxrnNnvR5Ge USD 4900 one-time, Brave Practice first month
 *     (metadata source=brave_practice, offer=49_first_month, event=the_brave_practice_2026)
 * Pro annual prod_VJ5DlKX4ZZns8z
 *   price_1UIT2kQ4WJOENoxr52VvUYoz USD 99000 / year
 *   price_1UYy7iQ4WJOENoxrI40SHKms USD 199000 / year, metadata effective=2026-12-01
 * Europe founding prod_VYaJmk3eCkPiUy — EUR 7900 / month, EUR 79000 / year
 * New Zealand founding prod_VYaJIqgAYwhqve — NZD 13900 / month, NZD 139000 / year
 * Canada founding prod_VTwMZY3faYTky3
 * Australia founding prod_VTwMakTvHINmCP
 * UK founding prod_VS4qGI1fvtmRIl
 * Dubai monthly prod_VTymvFzActlCL4 — AED 36400 / month
 * Dubai annual prod_VTyqtTf1bvsuSp — AED 363600 one-time
 * Multi-office prod_VZ8W30UpFGteXc "NeuroChiro Membership - 4 Offices"
 *   USD 30600 / month and USD 306000 / year ($99 first office + $69 each additional).
 *   A two-clinic price on this product, or any product whose name says two clinics
 *   or 2 offices, is the same membership.
 * Back pay prod_Vd5qubvW8rFqdk — metadata type=doctor_membership_backpay, USD 3900 one-time
 * Older directory memberships (same name family):
 *   prod_TInZz4KZa1GkZm, prod_TwWMy08S4QYiMz, prod_TwWOnJoaGt4vxW,
 *   prod_TVSSqCuRmHqLDM, prod_TVSWFsBTlIDOJl, prod_TVajRvVh1QmFxV,
 *   prod_TVajBrQVOEM9ZC, prod_TVakjswIcMW4AY
 * Older Pro prices still on the account:
 *   prod_UQx2BzZdeBxSXw NeuroChiro Pro
 *   prod_UQx3Zr84vGKDOw NeuroChiro Pro- Annually
 *
 * Not doctor membership: NeuroChiro Student Membership
 *   (prod_VXtrG9w7WGWKdW, prod_UIYcGm8RmktGc8, prod_UIYZVPclk7Pdx7),
 *   Patient Premium, Synapse, NeurOS, seminars, jobs, Inner Circle, Mastermind.
 */

export const DOCTOR_MEMBERSHIP_PRODUCT_IDS = [
  'prod_VHErgcWaKV4LZe',
  'prod_VJ5DlKX4ZZns8z',
  'prod_UQx2BzZdeBxSXw',
  'prod_UQx3Zr84vGKDOw',
  'prod_VYaJmk3eCkPiUy',
  'prod_VYaJIqgAYwhqve',
  'prod_VTwMZY3faYTky3',
  'prod_VTwMakTvHINmCP',
  'prod_VS4qGI1fvtmRIl',
  'prod_VTymvFzActlCL4',
  'prod_VTyqtTf1bvsuSp',
  'prod_VZ8W30UpFGteXc',
  'prod_Vd5qubvW8rFqdk',
  'prod_TInZz4KZa1GkZm',
  'prod_TwWMy08S4QYiMz',
  'prod_TwWOnJoaGt4vxW',
  'prod_TVSSqCuRmHqLDM',
  'prod_TVSWFsBTlIDOJl',
  'prod_TVajRvVh1QmFxV',
  'prod_TVajBrQVOEM9ZC',
  'prod_TVakjswIcMW4AY',
] as const

const NAME_OK = [
  /^neurochiro pro\b/i,
  /^neurochiro directory membership\b/i,
  /^neurochiro membership\b/i,
  /^neurochiro founding member\b/i,
  /^neurochiro .+ - founding member$/i,
  /^neurochiro membership back pay\b/i,
]

const NAME_BLOCK = /student|patient premium|synapse|seminar|inner circle|mastermind|neuros|elderberry|workshop|course|job listing|vendor|care plan|associateship/i

export type ProductHint = {
  id: string | null
  name: string | null
  metadata?: Record<string, string | null | undefined> | null
  priceMetadata?: Record<string, string | null | undefined> | null
}

export function doctorMembershipProductIds(env: NodeJS.ProcessEnv = process.env): string[] {
  const extra = (env.STRIPE_DOCTOR_MEMBERSHIP_PRODUCT_IDS || '')
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter((id) => id.startsWith('prod_'))
  return [...new Set([...DOCTOR_MEMBERSHIP_PRODUCT_IDS, ...extra])]
}

function metaBlob(product: ProductHint): string {
  const pairs = [
    ...Object.entries(product.metadata || {}),
    ...Object.entries(product.priceMetadata || {}),
  ]
  return pairs
    .map(([key, value]) => `${key}=${value || ''}`)
    .join(' ')
    .toLowerCase()
}

export function isStudentProduct(product: ProductHint | null | undefined): boolean {
  if (!product) return false
  const name = (product.name || '').toLowerCase()
  if (name.includes('student')) return true
  const blob = metaBlob(product)
  return blob.includes('student_membership') || blob.includes('kind=student') || blob.includes('role=student')
}

export function productNameIsDoctorMembership(name: string | null | undefined): boolean {
  const value = (name || '').trim()
  if (!value || NAME_BLOCK.test(value)) return false
  return NAME_OK.some((pattern) => pattern.test(value))
}

/** Metadata, configured product id, or the doctor-membership product name. */
export function isDoctorMembershipProduct(
  product: ProductHint | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!product || isStudentProduct(product)) return false
  const blob = metaBlob(product)
  if (blob.includes('doctor_membership')) return true
  if (/(?:^|\s)role=doctor(?:\s|$)/.test(blob)) return true
  if (blob.includes('source=brave_practice') || blob.includes('offer=49_first_month') || blob.includes('offer=39_first_month')) {
    return true
  }
  const id = (product.id || '').trim()
  if (id && doctorMembershipProductIds(env).includes(id)) return true
  return productNameIsDoctorMembership(product.name)
}
