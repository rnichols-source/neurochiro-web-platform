import { FALLBACK_FX, type FxTable, minorToUsd, monthlyMinor, roundMoney } from './mrr-calc.ts'

export function parseMoneyInput(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[$,\s]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value < 0) return null
  return roundMoney(value)
}

export function parsePatientsStarted(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const value = Number(trimmed)
  if (!Number.isInteger(value) || value < 0) return null
  return value
}

export function parseReportedOn(raw: string | null | undefined): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null
  return value
}

export function todayInNewYork(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function annualizeMembershipUsd(params: {
  unitAmount: number
  quantity?: number
  interval: string
  intervalCount?: number
  currency: string
  rates?: FxTable
}): number | null {
  if (!Number.isFinite(params.unitAmount) || params.unitAmount <= 0) return null
  const monthly = monthlyMinor(params.unitAmount, params.quantity ?? 1, params.interval, params.intervalCount ?? 1)
  if (!monthly) return null
  const usd = minorToUsd(monthly * 12, params.currency, params.rates || FALLBACK_FX)
  if (!Number.isFinite(usd) || usd <= 0) return null
  return roundMoney(usd)
}

export function roiMultiple(estRevenueUsd: number, membershipAnnualUsd: number): number | null {
  if (!Number.isFinite(estRevenueUsd) || !Number.isFinite(membershipAnnualUsd) || membershipAnnualUsd <= 0) return null
  return roundMoney(estRevenueUsd / membershipAnnualUsd)
}

export function formatRoiMultiple(value: number): string {
  const rounded = Math.abs(value - Math.round(value)) < 0.05 ? Math.round(value) : Number(value.toFixed(1))
  return `${rounded}×`
}

export function sumRevenue(values: Array<number | null | undefined>): number | null {
  let total = 0
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) return null
    total += value
  }
  return roundMoney(total)
}

export function numericOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}
