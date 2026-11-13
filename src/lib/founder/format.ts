export const FOUNDING_END = new Date('2026-12-01T05:00:00.000Z')

export function daysUntil(now: Date, end: Date): number {
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000))
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid]
  return (sorted[mid - 1] + sorted[mid]) / 2
}

export function barPercent(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 8
  const width = (100 * Math.log10(value + 1)) / Math.log10(max + 1)
  return Math.max(8, Math.min(100, Math.round(width)))
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatMoney(amount: number | null, currency = 'USD'): string {
  if (amount == null || !Number.isFinite(amount)) return '—'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: amount >= 100 ? 0 : 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

export function formatHours(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) return '—'
  if (hours < 36) return `${Math.max(1, Math.round(hours))} h`
  return `${Math.max(1, Math.round(hours / 24))} d`
}

export function parseVisitPrice(raw: string | null | undefined): number | null {
  if (!raw) return null
  const match = raw.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value) || value < 20 || value > 2000) return null
  return value
}

export function weekStart(date: Date): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = copy.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  copy.setUTCDate(copy.getUTCDate() - diff)
  return copy
}

export function lastWeeks(now: Date, count: number): { start: string; label: string }[] {
  const first = weekStart(now)
  const weeks: { start: string; label: string }[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(first)
    start.setUTCDate(start.getUTCDate() - i * 7)
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(start)
    weeks.push({ start: start.toISOString().slice(0, 10), label: i === 0 ? `${label}*` : label })
  }
  return weeks
}

export function countryName(code: string): string {
  const names: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    GB: 'United Kingdom',
    UK: 'United Kingdom',
    AU: 'Australia',
    ZA: 'South Africa',
    DE: 'Germany',
    NG: 'Nigeria',
    IN: 'India',
    MX: 'Mexico',
    NZ: 'New Zealand',
    IE: 'Ireland',
    NL: 'Netherlands',
    FR: 'France',
    AE: 'United Arab Emirates',
  }
  return names[code] || code || 'Unknown'
}

export function cleanUtm(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, 120)
  if (!trimmed || !/^[\w .+:/@|-]+$/.test(trimmed)) return null
  return trimmed
}

export function etStamp(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  }).format(now).replace(',', ' ·')
}
