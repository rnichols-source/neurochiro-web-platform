import { haversineDistance } from '../geo.ts'
import { extractInstagramHandle } from '../instagram.ts'

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
  displayName?: string
  city: string
  state: string
  latitude: number
  longitude: number
  notifiedDoctorIds: string[]
  commentUrl?: string
  dmThreadUrl?: string
  lastDoctorSentId?: string | null
  lastDoctorSentMiles?: number | null
  flaggedBusiness?: boolean
}

export type IgMatch = IgWaiter & { miles: number; band: 25 | 50 }

export type IgGoLiveMatch = IgWaiter & { miles: number }

/** People within this many miles of a doctor who just went live. */
export const IG_GO_LIVE_RADIUS_MILES = 60

/**
 * A previous doctor farther than this is not "nearby".
 * Those people are included again when a closer doctor goes live.
 */
export const IG_ALREADY_NEAR_MILES = 30

const COMMENT_TEMPLATES = [
  (who: string, doctorTag: string, place: string, link: string) =>
    `Hey ${who} — it's Dr. Ray. ${doctorTag} just joined NeuroChiro near ${place}. If you want their office to reach out, request a visit here: ${link}`,
  (who: string, doctorTag: string, place: string, link: string) =>
    `${who} ${doctorTag} is now on NeuroChiro near ${place}. Their office can follow up from this request form: ${link}`,
  (who: string, doctorTag: string, place: string, link: string) =>
    `Hi ${who}, Dr. Ray here. Tagging ${doctorTag}, who just went live near ${place}. Request a visit: ${link}`,
  (who: string, doctorTag: string, place: string, link: string) =>
    `${who} — Dr. Ray. ${doctorTag} just went live near ${place}. Ask their office to reach out with this form: ${link}`,
]

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

/** Listing request form. The hash opens the appointment form on that doctor's page. */
export function doctorRequestFormUrl(slugOrProfileUrl: string | null | undefined): string {
  const raw = (slugOrProfileUrl || '').trim()
  if (!raw) return 'https://neurochiro.co/directory'
  let slug = raw
  if (raw.startsWith('http')) {
    try {
      const url = new URL(raw)
      if (url.protocol === 'https:' && url.hostname === 'neurochiro.co') {
        slug = url.pathname.replace(/^\/directory\//, '').replace(/\/$/, '')
      }
    } catch {
      slug = raw
    }
  }
  slug = slug.replace(/^\/directory\//, '').replace(/\/$/, '').split('#')[0].toLowerCase()
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return 'https://neurochiro.co/directory'
  return `https://neurochiro.co/directory/${slug}#appointment-form`
}

/** Handle saved on the doctor listing, without the @. */
export function listingInstagramHandle(instagramUrl: string | null | undefined, normalized: string | null | undefined): string {
  const fromUrl = extractInstagramHandle(instagramUrl)
  const urlHandle = fromUrl ? cleanHandle(fromUrl) : ''
  if (urlHandle && HANDLE.test(urlHandle)) return urlHandle
  const stored = cleanHandle(normalized || '')
  if (stored && HANDLE.test(stored)) return stored
  return ''
}

export function instagramPersonLabel(handle: string, name: string): string {
  const clean = cleanHandle(handle)
  if (clean && HANDLE.test(clean)) return `@${clean}`
  return name.trim() || 'there'
}

export function instagramDoctorTag(handle: string, doctorName: string): string {
  const clean = cleanHandle(handle)
  if (clean && HANDLE.test(clean)) return `@${clean}`
  return doctorName.trim() || 'the new NeuroChiro doctor'
}

export function commentVariantIndex(seed: string, count = COMMENT_TEMPLATES.length): number {
  let hash = 2166136261
  const size = count > 0 ? count : 1
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % size
}

export function instagramComment(input: {
  name: string
  handle: string
  doctorName: string
  doctorHandle: string
  doctorCity: string
  profileUrl: string
  variantKey: string
}): string {
  const who = instagramPersonLabel(input.handle, input.name)
  const doctorTag = instagramDoctorTag(input.doctorHandle, input.doctorName)
  const place = input.doctorCity.trim() || 'you'
  const link = doctorRequestFormUrl(input.profileUrl)
  const template = COMMENT_TEMPLATES[commentVariantIndex(input.variantKey)] || COMMENT_TEMPLATES[0]
  return template(who, doctorTag, place, link)
}

export function instagramDm(input: {
  name: string
  handle: string
  doctorName: string
  doctorCity: string
  profileUrl: string
}): string {
  const who = input.name.trim() || instagramPersonLabel(input.handle, '')
  const place = input.doctorCity.trim() || 'your area'
  const link = doctorRequestFormUrl(input.profileUrl)
  return `Hey ${who} — it's Dr. Ray. A new NeuroChiro doctor just joined near you: ${input.doctorName} in ${place}. If you want their office to reach out, use this request form: ${link}`
}

export function musePaste(rows: {
  handle: string
  message: string
  displayName?: string
  comment?: string
  commentUrl?: string
  dmUrl?: string
}[]): string {
  return rows.map((row) => {
    const handle = cleanHandle(row.handle)
    const lines = [handle ? `@${handle}` : (row.displayName?.trim() || 'No name saved')]
    if (row.commentUrl) lines.push(`Comment: ${row.commentUrl}`)
    if (row.dmUrl) lines.push(`DM thread: ${row.dmUrl}`)
    if (row.comment?.trim()) {
      lines.push('COMMENT')
      lines.push(row.comment.trim())
    }
    if (row.message.trim()) {
      if (row.comment?.trim()) lines.push('DM')
      lines.push(row.message.trim())
    }
    return lines.join('\n')
  }).join('\n\n')
}

function usablePoint(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)
}

/**
 * People this new doctor should be told about.
 * They are within 60 miles, this doctor is the closest live doctor,
 * and they were not already sent a doctor within about 30 miles.
 */
export function matchClosestIgWaiters(
  waiters: IgWaiter[],
  doctor: { id: string; latitude: number; longitude: number },
  liveDoctors: { id: string; latitude: number; longitude: number }[],
  limitMiles = IG_GO_LIVE_RADIUS_MILES,
): IgGoLiveMatch[] {
  const others = liveDoctors.filter((row) => row.id !== doctor.id && usablePoint(row.latitude, row.longitude))
  const matches: IgGoLiveMatch[] = []
  for (const waiter of waiters) {
    if (waiter.flaggedBusiness) continue
    if (waiter.notifiedDoctorIds.includes(doctor.id)) continue
    if (waiter.lastDoctorSentId && waiter.lastDoctorSentId === doctor.id) continue
    if (!usablePoint(waiter.latitude, waiter.longitude)) continue
    const milesRaw = haversineDistance(doctor.latitude, doctor.longitude, waiter.latitude, waiter.longitude)
    if (milesRaw > limitMiles) continue
    const previous = waiter.lastDoctorSentMiles
    if (typeof previous === 'number' && Number.isFinite(previous) && previous <= IG_ALREADY_NEAR_MILES) continue
    const closerLiveDoctor = others.some((other) =>
      haversineDistance(other.latitude, other.longitude, waiter.latitude, waiter.longitude) < milesRaw,
    )
    if (closerLiveDoctor) continue
    matches.push({ ...waiter, miles: Math.round(milesRaw * 10) / 10 })
  }
  matches.sort((a, b) => a.miles - b.miles)
  return matches
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
