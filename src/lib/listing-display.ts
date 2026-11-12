/**
 * Public name for a directory listing.
 *
 * `listing_format = 'practice'` is equal billing: the practice name is the
 * title, and every co-owner is shown the same way. `profile_style = 'practice'`
 * is the older layout (clinic title, still "led by" one doctor) and is not
 * this mode. Lead-doctor listings keep using the doctor's name.
 */

export type CoOwner = {
  name: string
  credentials?: string | null
  photo_url?: string | null
  bio?: string | null
  role?: string | null
}

export type ListingSource = {
  listing_format?: string | null
  clinic_name?: string | null
  first_name?: string | null
  last_name?: string | null
  photo_url?: string | null
  co_owners?: unknown
}

const HONORIFIC = /\b(dr|doctor)\b\.?/gi

function clip(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function httpUrl(value: string): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function isPracticeListing(row: { listing_format?: string | null } | null | undefined): boolean {
  return row?.listing_format === 'practice'
}

/** Account-holder name. Lead-doctor listings show this to patients. */
export function doctorFormalName(row: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  return `Dr. ${row?.first_name || ''} ${row?.last_name || ''}`
    .replace(/\s+/g, ' ')
    .replace(/^Dr\.\s+Dr\./i, 'Dr.')
    .trim()
}

/**
 * Name patients should see. Practice-first listings use the practice name.
 * Every referral, card, and SEO surface should use this instead of building
 * `Dr. First Last` on its own.
 */
export function listingDisplayName(row: ListingSource | null | undefined): string {
  if (isPracticeListing(row)) {
    const clinic = (row?.clinic_name || '').trim()
    if (clinic) return clinic
  }
  const formal = doctorFormalName(row)
  return formal === 'Dr.' ? 'NeuroChiro doctor' : formal
}

export function parseCoOwners(value: unknown): CoOwner[] {
  let raw = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      raw = JSON.parse(trimmed)
    } catch {
      return []
    }
  }
  if (!Array.isArray(raw)) return []
  const owners: CoOwner[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const name = clip(row.name, 120)
    if (!name) continue
    owners.push({
      name,
      credentials: clip(row.credentials, 80) || null,
      photo_url: httpUrl(clip(row.photo_url, 500)),
      bio: clip(row.bio, 4000) || null,
      role: clip(row.role, 80) || null,
    })
    if (owners.length >= 8) break
  }
  return owners
}

export function credentialedName(owner: CoOwner): string {
  const name = owner.name.trim()
  const credentials = (owner.credentials || '').trim()
  if (!credentials) return name
  if (name.toLowerCase().includes(credentials.toLowerCase())) return name
  return `${name}, ${credentials}`
}

export function formatPeopleList(names: string[]): string {
  const clean = names.map((name) => name.trim()).filter(Boolean)
  if (clean.length === 0) return ''
  if (clean.length === 1) return clean[0]
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`
}

export function coOwnerLine(row: ListingSource | null | undefined): string {
  return formatPeopleList(parseCoOwners(row?.co_owners).map(credentialedName))
}

/** Card title plus the line under it. Lead listings keep clinic under the doctor. */
export function listingCardCopy(row: ListingSource | null | undefined): { title: string; detail: string } {
  const title = listingDisplayName(row)
  if (isPracticeListing(row)) return { title, detail: coOwnerLine(row) }
  return { title, detail: (row?.clinic_name || '').trim() }
}

export function listingPhotos(row: ListingSource | null | undefined): { src: string; alt: string }[] {
  if (isPracticeListing(row)) {
    return parseCoOwners(row?.co_owners)
      .filter((owner) => owner.photo_url)
      .slice(0, 2)
      .map((owner) => ({ src: owner.photo_url as string, alt: credentialedName(owner) }))
  }
  const src = (row?.photo_url || '').trim()
  if (!src) return []
  return [{ src, alt: listingDisplayName(row) }]
}

export function listingMeta(
  row: ListingSource | null | undefined,
  input: { location: string; specialties?: string[] | null },
): { title: string; description: string; imageAlt: string } {
  const location = input.location.trim()
  const specialtyList = (input.specialties || []).filter(Boolean).slice(0, 3).join(', ')
  const specialty = specialtyList || 'Nervous System Chiropractic'
  if (!isPracticeListing(row)) {
    const name = doctorFormalName(row)
    const title = `${name} | Nervous System Specialist at ${row?.clinic_name || ''}`
    const description = `Visit ${name} in ${location}. Specializing in ${specialty}. Verified member of the NeuroChiro network of elite clinical practitioners.`
    return { title, description, imageAlt: `${name} - ${row?.clinic_name || ''}`.trim() }
  }
  const practice = listingDisplayName(row)
  const owners = coOwnerLine(row)
  const title = owners
    ? `${practice} | ${owners}${location ? ` in ${location}` : ''}`
    : `${practice}${location ? ` | Nervous system chiropractic in ${location}` : ''}`
  const who = owners ? ` Co-owners ${owners}.` : ''
  const description = `Visit ${practice} in ${location}.${who} Specializing in ${specialty}. Verified member of the NeuroChiro network.`
  return {
    title,
    description,
    imageAlt: owners ? `${practice} — ${owners}` : practice,
  }
}

/** Compare a co-owner with a team-member row so staff lists do not repeat them. */
export function sameListingPerson(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (value: string | null | undefined) => (value || '')
    .toLowerCase()
    .replace(HONORIFIC, ' ')
    .replace(/\b(dc|caccp|dacnb|ccsp|chiropractor)\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const left = norm(a)
  const right = norm(b)
  if (!left || !right) return false
  return left === right || left.includes(right) || right.includes(left)
}

export function attachDisplayName<T extends ListingSource>(row: T): T & { display_name: string } {
  return { ...row, display_name: listingDisplayName(row) }
}
