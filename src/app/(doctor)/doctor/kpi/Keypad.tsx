'use client'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export default function Keypad({
  allowDecimal,
  onDigit,
  onBackspace,
  onClear,
}: {
  allowDecimal: boolean
  onDigit: (digit: string) => void
  onBackspace: () => void
  onClear: () => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2" data-testid="kpi-keypad">
      {KEYS.map((key) => (
        <button key={key} type="button" onClick={() => onDigit(key)} className="min-h-14 rounded-xl border border-portal-border bg-white text-xl font-bold text-portal-ink">
          {key}
        </button>
      ))}
      {allowDecimal ? (
        <button type="button" onClick={() => onDigit('.')} className="min-h-14 rounded-xl border border-portal-border bg-white text-xl font-bold text-portal-ink" aria-label="Decimal point">
          .
        </button>
      ) : (
        <button type="button" onClick={onClear} className="min-h-14 rounded-xl border border-portal-border bg-portal-surface text-sm font-bold text-portal-ink">
          Clear
        </button>
      )}
      <button type="button" onClick={() => onDigit('0')} className="min-h-14 rounded-xl border border-portal-border bg-white text-xl font-bold text-portal-ink">
        0
      </button>
      <button type="button" onClick={onBackspace} className="min-h-14 rounded-xl border border-portal-border bg-white text-sm font-bold text-portal-ink" aria-label="Delete last digit">
        Delete
      </button>
      {allowDecimal ? (
        <button type="button" onClick={onClear} className="col-span-3 min-h-11 rounded-xl border border-portal-border bg-portal-surface text-sm font-bold text-portal-ink">
          Clear
        </button>
      ) : null}
    </div>
  )
}

export function pushDigit(current: string, digit: string, allowDecimal: boolean): string {
  if (digit === '.') {
    if (!allowDecimal || current.includes('.')) return current
    return current === '' ? '0.' : `${current}.`
  }
  if (current === '0') return digit
  const [whole, fraction] = current.split('.')
  if (fraction != null) {
    if (fraction.length >= 2) return current
    return `${whole}.${fraction}${digit}`
  }
  if ((whole || '').replace('-', '').length >= 9) return current
  return `${current}${digit}`
}
