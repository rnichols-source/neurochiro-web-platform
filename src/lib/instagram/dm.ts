import { haversineDistance } from '../geo.ts'
import { waitlistRequestLink } from '../sms/templates.ts'

export type IgImportRow = {
  handle: string
  location: string
  requestedAt: string | null
}

export type ParsedPlace = {
  city: string
  state: string
  zip: string
  country: string
}

export type IgWaiter = {
  id: string
  handle: string
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  notifiedDoctorIds: string[]
}

export type IgMatch = IgWaiter & { miles: number; band: 25 | 50 }

const HANDLE = /^@?[a-z0-9._]{1,30}$/i

export function cleanHandle(value: string): string {
  return value.trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase()
}

function splitRow(line: string): string[] {
  const parts: string[] = []
  let current = ''
  let quoted = false
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (!quoted && (char === ',' || char === '\t')) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  parts.push(current.trim())
  return parts.filter((part) => part.length > 0)
}

export function parseIgPaste(text: string): { rows: IgImportRow[]; errors: string[] } {
  const rows: IgImportRow[] = []
  const errors: string[] = []
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  for (const line of lines) {
    if (/^handle\b/i.test(line)) continue
    const parts = splitRow(line)
    if (parts.length < 2) {
      errors.push(`Need a handle and a location: ${line.slice(0, 80)}`)
      continue
    }
    const handle = cleanHandle(parts[0])
    if (!HANDLE.test(handle)) {
      errors.push(`That handle does not look like Instagram: ${parts[0].slice(0, 40)}`)
      continue
    }
    const date = parts.length >= 3 ? parts[parts.length - 1] : ''
    const location = (parts.length >= 3 ? parts.slice(1, -1) : parts.slice(1)).join(', ')
    const requestedAt = parseImportDate(date)
    rows.push({ handle, location, requestedAt })
  }
  return { rows, errors }
}

export function parseImportDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = Date.parse(trimmed)
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
  }
  const us = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!us) return null
  const year = us[3].length === 2 ? `20${us[3]}` : us[3]
  const parsed = Date.parse(`${year}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}T12:00:00Z`)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

export function parseLocation(raw: string): ParsedPlace {
  const text = raw.trim().replace(/\s+/g, ' ')
  const zip = text.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1] || ''
  const withoutZip = text.replace(/\b\d{5}(?:-\d{4})?\b/, '').replace(/\s+,/g, ',').replace(/,\s*$/, '').trim()
  const bits = withoutZip.split(',').map((part) => part.trim()).filter(Boolean)
  const city = bits[0] || ''
  const stateToken = (bits[1] || '').replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase()
  return { city, state: stateToken, zip, country: zip || stateToken ? 'US' : '' }
}

export function instagramDm(input: {
  name: string
  handle: string
  doctorName: string
  doctorCity: string
  profileUrl: string
}): string {
  const who = input.name.trim() || input.handle
  const place = input.doctorCity.trim() || 'your area'
  const link = waitlistRequestLink(input.profileUrl)
  return `Hey ${who} — it's Dr. Ray. A new NeuroChiro doctor just joined near you: ${input.doctorName} in ${place}. If you want their office to call, use this link: ${link}`
}

export function musePaste(rows: { handle: string; message: string }[]): string {
  return rows
    .map((row) => `@${cleanHandle(row.handle)}\n${row.message.trim()}`)
    .join('\n\n')
}

export function matchIgWaiters(
  waiters: IgWaiter[],
  doctor: { id: string; latitude: number; longitude: number },
  limitMiles = 50,
): IgMatch[] {
  const matches: IgMatch[] = []
  for (const waiter of waiters) {
    if (waiter.notifiedDoctorIds.includes(doctor.id)) continue
    if (!Number.isFinite(waiter.latitude) || !Number.isFinite(waiter.longitude)) continue
    if (waiter.latitude === 0 && waiter.longitude === 0) continue
    const miles = Math.round(haversineDistance(doctor.latitude, doctor.longitude, waiter.latitude, waiter.longitude) * 10) / 10
    if (miles > limitMiles) continue
    matches.push({ ...waiter, miles, band: miles <= 25 ? 25 : 50 })
  }
  matches.sort((a, b) => a.band - b.band || a.miles - b.miles)
  return matches
}

export function backfillWithin25(
  waiters: IgWaiter[],
  doctors: { id: string; latitude: number; longitude: number }[],
): { waiter: IgWaiter; doctorId: string; miles: number }[] {
  const rows: { waiter: IgWaiter; doctorId: string; miles: number }[] = []
  for (const waiter of waiters) {
    let best: { doctorId: string; miles: number } | null = null
    for (const doctor of doctors) {
      if (waiter.notifiedDoctorIds.includes(doctor.id)) continue
      const miles = haversineDistance(doctor.latitude, doctor.longitude, waiter.latitude, waiter.longitude)
      if (miles > 25) continue
      if (!best || miles < best.miles) best = { doctorId: doctor.id, miles: Math.round(miles * 10) / 10 }
    }
    if (best) rows.push({ waiter, doctorId: best.doctorId, miles: best.miles })
  }
  return rows
}
