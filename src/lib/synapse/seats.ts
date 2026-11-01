import { AT_RISK_BELOW, HOLDING_SEAT_STATUSES, PROOF_MIN_RATINGS, PROOF_WINDOW_DAYS, REVIEW_BELOW } from './config.ts'

export type SeatHold = {
  tier: string
  status: string
  reservedUntil: string | null
}

const HOLDING = new Set<string>(HOLDING_SEAT_STATUSES)

/** An expired unpaid reservation does not hold the category. Lapsed and revoked never do. */
export function seatHoldsCategory(seat: SeatHold, now: Date): boolean {
  if (seat.tier !== 'anchor') return false
  if (!HOLDING.has(seat.status)) return false
  if (seat.status === 'pending_payment') {
    if (!seat.reservedUntil) return false
    return new Date(seat.reservedUntil).getTime() > now.getTime()
  }
  return true
}

export type RatingRow = { rating: number; createdAt: string }

export type ProofResult = {
  score: number | null
  count: number
  flag: 'insufficient' | 'ok' | 'at_risk' | 'review'
}

function average(rows: RatingRow[]): number {
  const total = rows.reduce((sum, row) => sum + row.rating, 0)
  return Math.round((total / rows.length) * 100) / 100
}

/**
 * Proof Score is the average rating over the last 180 days.
 * Fewer than 5 ratings does not count.
 * Below 4.3 is at risk. Below 4.0 in both of the last two 90-day quarters is review.
 * This never returns revoked.
 */
export function proofScore(rows: RatingRow[], now: Date): ProofResult {
  const windowStart = now.getTime() - PROOF_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const recent = rows.filter((row) => {
    const at = new Date(row.createdAt).getTime()
    return at >= windowStart && at <= now.getTime() && row.rating >= 1 && row.rating <= 5
  })
  if (recent.length < PROOF_MIN_RATINGS) {
    return { score: null, count: recent.length, flag: 'insufficient' }
  }
  const score = average(recent)
  const midpoint = now.getTime() - 90 * 24 * 60 * 60 * 1000
  const older = recent.filter((row) => new Date(row.createdAt).getTime() < midpoint)
  const newer = recent.filter((row) => new Date(row.createdAt).getTime() >= midpoint)
  const bothQuartersLow = older.length > 0 && newer.length > 0 && average(older) < REVIEW_BELOW && average(newer) < REVIEW_BELOW
  if (bothQuartersLow) return { score, count: recent.length, flag: 'review' }
  if (score < AT_RISK_BELOW) return { score, count: recent.length, flag: 'at_risk' }
  return { score, count: recent.length, flag: 'ok' }
}
