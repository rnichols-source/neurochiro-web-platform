import { MEMBERSHIP_PAYBACK_CENTS } from './config.ts'

export function savedThisYearCents(rows: { amountSavedCents: number; createdAt: string }[], year: number): number {
  return rows.reduce((sum, row) => {
    const at = new Date(row.createdAt)
    if (at.getUTCFullYear() !== year) return sum
    const amount = Math.max(0, Math.floor(row.amountSavedCents || 0))
    return sum + amount
  }, 0)
}

export function paybackProgress(cents: number): { cents: number; goal: number; reached: boolean; ratio: number } {
  const safe = Math.max(0, cents)
  return {
    cents: safe,
    goal: MEMBERSHIP_PAYBACK_CENTS,
    reached: safe >= MEMBERSHIP_PAYBACK_CENTS,
    ratio: Math.min(1, safe / MEMBERSHIP_PAYBACK_CENTS),
  }
}
