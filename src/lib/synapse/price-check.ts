export type StripePriceShape = {
  unit_amount: number | null
  currency: string | null
  recurring?: { interval?: string | null } | null
}

export function priceMismatch(price: StripePriceShape, expected: { unitAmount: number; interval: 'year' | null }): string | null {
  if ((price.currency || '').toLowerCase() !== 'usd') return 'Stripe price currency is not usd.'
  if (price.unit_amount !== expected.unitAmount) return 'Stripe price amount does not match the Synapse config.'
  const interval = price.recurring?.interval ?? null
  if (interval !== expected.interval) return 'Stripe price interval does not match the Synapse config.'
  return null
}
