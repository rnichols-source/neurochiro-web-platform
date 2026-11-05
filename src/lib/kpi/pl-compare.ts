export type MonthCollections = {
  month: string
  kpi: number | null
  pl: number | null
  difference: number | null
  flag: boolean
}

/**
 * Scorecard collections versus the saved P&L for the same month.
 * A gap larger than about 5% of the P&L (or of the scorecard, when the P&L is zero) is flagged.
 */
export function compareMonthCollections(kpi: number | null, pl: number | null, month: string): MonthCollections {
  if (kpi == null || pl == null) {
    return { month, kpi, pl, difference: null, flag: false }
  }
  const difference = kpi - pl
  const base = pl !== 0 ? Math.abs(pl) : Math.abs(kpi)
  const flag = base === 0 ? false : Math.abs(difference) / base > 0.05
  return { month, kpi, pl, difference, flag }
}
