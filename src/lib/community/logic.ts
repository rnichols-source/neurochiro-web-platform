import { isPracticeListing, listingDisplayName, doctorFormalName } from '../listing-display.ts'
import { isDoctorPubliclyVisible, type PublicListingRow } from '../directory/visibility.ts'
import { containsHealthWords, isPlausibleEmail, isPlausiblePhone } from '../leads/validate.ts'
import { firstName, greeting } from '../portal/greeting.ts'

/**
 * Community members are stored as profiles.role = 'patient'.
 * That value stays in the database so existing accounts, RLS, and doctor
 * login correction keep working. User-facing copy says community member.
 */

export const STORED_COMMUNITY_ROLE = 'patient'
export const COMMUNITY_ROLE_LABEL = 'Community member'
export const MAX_FAMILY = 12
export const MAX_NOTE = 400
export const HOME_PATH = '/portal'

export const RELATIONSHIPS = ['spouse', 'partner', 'child', 'parent', 'sibling', 'other'] as const
export type Relationship = (typeof RELATIONSHIPS)[number]

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  spouse: 'Spouse',
  partner: 'Partner',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other',
}

export type PrivacyPrefs = {
  shareNameWithHomeDoctor: boolean
  shareEmailWithHomeDoctor: boolean
  sharePhoneWithHomeDoctor: boolean
  shareFamilyFirstNamesWithHomeDoctor: boolean
  shareHomeClinicWithOtherDoctors: boolean
}

export const DEFAULT_PRIVACY: PrivacyPrefs = {
  shareNameWithHomeDoctor: false,
  shareEmailWithHomeDoctor: false,
  sharePhoneWithHomeDoctor: false,
  shareFamilyFirstNamesWithHomeDoctor: false,
  shareHomeClinicWithOtherDoctors: false,
}

export type VisitShareInput = {
  shareFirstName: boolean
  shareForName: boolean
  shareEmail: boolean
  sharePhone: boolean
  shareFamilyFirstNames: boolean
  selfFirstName: string
  email: string | null
  phone: string | null
  familyFirstNames: string[]
  forFamilyFirstName: string | null
  note: string
  preferredWindow: string
}

export type VisitShare = {
  sharedFirstName: string | null
  forFirstName: string | null
  sharedEmail: string | null
  callbackPhone: string | null
  sharedFamilyNames: string | null
  note: string | null
  preferredWindow: string | null
  error: string | null
}

const COMMUNITY_PREFIXES = [
  '/portal/care',
  '/portal/week',
  '/portal/work',
  '/portal/passport',
  '/portal/you',
  '/portal/family',
  '/portal/privacy',
  '/portal/find',
  '/portal/visit',
]

export function isCommunityPath(path: string | null | undefined): boolean {
  if (!path) return false
  const clean = path.split('?')[0].replace(/\/$/, '') || '/'
  if (clean === HOME_PATH || clean === '/portal/dashboard') return true
  return COMMUNITY_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))
}

export function communityNavId(path: string | null | undefined): 'home' | 'care' | 'week' | 'work' | 'you' {
  const clean = (path || '').split('?')[0]
  if (clean.startsWith('/portal/you') || clean.startsWith('/portal/privacy')) return 'you'
  if (clean.startsWith('/portal/week')) return 'week'
  if (clean.startsWith('/portal/work')) return 'work'
  if (
    clean.startsWith('/portal/care') ||
    clean.startsWith('/portal/find') ||
    clean.startsWith('/portal/visit') ||
    clean.startsWith('/portal/family') ||
    clean.startsWith('/portal/passport')
  ) return 'care'
  return 'home'
}

export function isStoredCommunityRole(role: string | null | undefined): boolean {
  return (role || '').trim() === STORED_COMMUNITY_ROLE
}

export function roleLabel(role: string | null | undefined): string {
  if (isStoredCommunityRole(role)) return COMMUNITY_ROLE_LABEL
  if (role === 'student' || (role || '').startsWith('student')) return 'Student'
  if (role === 'doctor' || (role || '').startsWith('doctor')) return 'Doctor'
  return 'Account'
}

export function signupChoiceLabel(role: 'doctor' | 'student' | 'patient'): string {
  if (role === 'patient') return COMMUNITY_ROLE_LABEL
  if (role === 'student') return 'Student'
  return 'Doctor'
}

export function discordSignupLabel(role: string): string {
  if (role === STORED_COMMUNITY_ROLE) return 'COMMUNITY MEMBER'
  if (role === 'student') return 'STUDENT'
  if (role === 'doctor') return 'DOCTOR'
  return role.toUpperCase()
}

export function networkJoinLine(role: string): string {
  const label = role === STORED_COMMUNITY_ROLE ? 'community member' : role
  return `New ${label} joined the network`
}

export function memberInitial(fullName: string | null | undefined): string {
  const name = displayFirstName(fullName)
  return name ? name[0].toUpperCase() : 'Y'
}

export function displayFirstName(fullName: string | null | undefined): string | null {
  const name = firstName(fullName)
  return name && name !== 'there' ? name : null
}

export function homeGreeting(now: Date, timeZone: string, fullName: string | null | undefined): string {
  const hello = greeting(now, timeZone)
  const name = displayFirstName(fullName)
  return name ? `${hello}, ${name}` : hello
}

export function cleanFirstName(raw: string | null | undefined): string | null {
  const name = (raw || '').trim().replace(/\s+/g, ' ')
  if (name.length < 1 || name.length > 40) return null
  if (!/^[\p{L}][\p{L}\s.'-]{0,39}$/u.test(name)) return null
  return name
}

export function isRelationship(value: string | null | undefined): value is Relationship {
  return (RELATIONSHIPS as readonly string[]).includes(value || '')
}

export function allowsAccountInvite(relationship: Relationship): boolean {
  return relationship !== 'child'
}

export function householdLine(familyFirstNames: string[]): string {
  const names = familyFirstNames.map((name) => name.trim()).filter(Boolean)
  if (names.length === 0) {
    return 'Add the people in your household, including children, without a separate account.'
  }
  if (names.length === 1) return `${names[0]} is under this roof with you.`
  if (names.length === 2) return `${names[0]} and ${names[1]} are under this roof with you.`
  return `${names[0]} and ${names.length - 1} others are under this roof with you.`
}

export type DoctorCardSource = PublicListingRow & {
  id?: string
  first_name?: string | null
  last_name?: string | null
  clinic_name?: string | null
  city?: string | null
  state?: string | null
  photo_url?: string | null
  listing_format?: string | null
  slug?: string | null
}

export function doctorMayBeHomeDoctor(row: PublicListingRow | null | undefined): boolean {
  if (!row) return false
  return isDoctorPubliclyVisible(row)
}

export function safePhotoUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function doctorInitials(row: DoctorCardSource): string {
  if (isPracticeListing(row) && row.clinic_name) {
    const parts = row.clinic_name.split(/\s+/).filter((word) => /[A-Za-z]/.test(word[0] || ''))
    const letters = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`
    if (letters) return letters.toUpperCase()
  }
  const letters = `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`
  return letters.toUpperCase() || 'NC'
}

export type HomeDoctorCard = {
  id: string
  title: string
  practice: string | null
  place: string
  initials: string
  photoUrl: string | null
  profileHref: string | null
  listed: boolean
}

export function homeDoctorCard(row: DoctorCardSource & { id: string }): HomeDoctorCard {
  const city = (row.city || '').trim()
  const where = city || (row.state || '').trim()
  const practiceListing = isPracticeListing(row)
  const practice = (row.clinic_name || '').trim()
  return {
    id: row.id,
    title: practiceListing ? listingDisplayName(row) : doctorFormalName(row),
    practice: practiceListing ? null : (practice || null),
    place: where ? `${where} · your home doctor` : 'Your home doctor',
    initials: doctorInitials(row),
    photoUrl: safePhotoUrl(row.photo_url),
    profileHref: row.slug ? `/chiropractor/${row.slug}` : null,
    listed: doctorMayBeHomeDoctor(row),
  }
}

export function privacyFromRow(row: Record<string, unknown> | null | undefined): PrivacyPrefs {
  if (!row) return { ...DEFAULT_PRIVACY }
  return {
    shareNameWithHomeDoctor: row.share_name_with_home_doctor === true,
    shareEmailWithHomeDoctor: row.share_email_with_home_doctor === true,
    sharePhoneWithHomeDoctor: row.share_phone_with_home_doctor === true,
    shareFamilyFirstNamesWithHomeDoctor: row.share_family_first_names_with_home_doctor === true,
    shareHomeClinicWithOtherDoctors: row.share_home_clinic_with_other_doctors === true,
  }
}

export function privacyToRow(profileId: string, prefs: PrivacyPrefs): Record<string, unknown> {
  return {
    profile_id: profileId,
    share_name_with_home_doctor: prefs.shareNameWithHomeDoctor === true,
    share_email_with_home_doctor: prefs.shareEmailWithHomeDoctor === true,
    share_phone_with_home_doctor: prefs.sharePhoneWithHomeDoctor === true,
    share_family_first_names_with_home_doctor: prefs.shareFamilyFirstNamesWithHomeDoctor === true,
    share_home_clinic_with_other_doctors: prefs.shareHomeClinicWithOtherDoctors === true,
    updated_at: new Date().toISOString(),
  }
}

const WINDOWS = ['Weekday morning', 'Weekday afternoon', 'Evening', 'No preference']

export function cleanPreferredWindow(value: string | null | undefined): string | null {
  const trimmed = (value || '').trim()
  if (!trimmed) return null
  return WINDOWS.includes(trimmed) ? trimmed : null
}

export function prepareVisitShare(input: VisitShareInput): VisitShare {
  const note = input.note.trim().slice(0, MAX_NOTE)
  if (containsHealthWords(note)) {
    return emptyShare('Keep the note to scheduling. Your NeuroChiro does not store symptoms or a chart.')
  }
  const preferredWindow = cleanPreferredWindow(input.preferredWindow)
  const selfName = cleanFirstName(input.selfFirstName)
  const forName = input.shareForName ? cleanFirstName(input.forFamilyFirstName) : null
  if (input.shareFirstName && !selfName) {
    return emptyShare('Add your name on your account before sharing it.')
  }
  if (input.shareForName && !forName) {
    return emptyShare('Choose who the visit is for before sharing their name.')
  }
  const email = input.shareEmail ? (isPlausibleEmail(input.email) ? input.email!.trim().toLowerCase() : null) : null
  if (input.shareEmail && !email) {
    return emptyShare('There is no email on this account to share.')
  }
  const phone = input.sharePhone ? (isPlausiblePhone(input.phone) ? input.phone!.trim() : null) : null
  if (input.sharePhone && !phone) {
    return emptyShare('Enter a phone number you want the office to use, or leave that box unchecked.')
  }
  const names = input.shareFamilyFirstNames
    ? uniqueNames(input.familyFirstNames.map((name) => cleanFirstName(name)).filter((name): name is string => !!name))
    : []
  if (input.shareFamilyFirstNames && names.length === 0) {
    return emptyShare('Add a family member before sharing household first names.')
  }
  return {
    sharedFirstName: input.shareFirstName ? selfName : null,
    forFirstName: forName,
    sharedEmail: email,
    callbackPhone: phone,
    sharedFamilyNames: names.length ? names.join(', ') : null,
    note: note || null,
    preferredWindow,
    error: null,
  }
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of names) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out.slice(0, MAX_FAMILY)
}

function emptyShare(error: string): VisitShare {
  return {
    sharedFirstName: null,
    forFirstName: null,
    sharedEmail: null,
    callbackPhone: null,
    sharedFamilyNames: null,
    note: null,
    preferredWindow: null,
    error,
  }
}

export function doctorVisitNotice(share: Pick<VisitShare, 'sharedFirstName' | 'forFirstName' | 'sharedEmail' | 'callbackPhone' | 'sharedFamilyNames' | 'preferredWindow'>): { title: string; body: string } {
  const who = share.sharedFirstName || 'A community member'
  const opening = share.forFirstName
    ? `${who} requested a visit for ${share.forFirstName}.`
    : `${who} requested a visit through Your NeuroChiro.`
  const parts = [opening]
  if (share.sharedFamilyNames) parts.push(`Household first names they chose to share: ${share.sharedFamilyNames}.`)
  if (share.preferredWindow) parts.push(`Preferred time: ${share.preferredWindow}.`)
  if (share.sharedEmail || share.callbackPhone) parts.push('Contact details they chose to share are on the request.')
  else parts.push('They did not share an email or phone.')
  return { title: 'Visit request', body: parts.join(' ') }
}

export function hasRecentOpenRequest(
  requests: { doctorId: string; status: string; createdAt: string }[],
  doctorId: string,
  now: Date,
): boolean {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000
  return requests.some((request) => {
    if (request.doctorId !== doctorId || request.status !== 'requested') return false
    const created = new Date(request.createdAt).getTime()
    return Number.isFinite(created) && created >= cutoff
  })
}

export function communityWelcome(name: string | null | undefined): {
  subject: string
  title: string
  html: string
  ctaText: string
  ctaUrl: string
} {
  const who = displayFirstName(name) || 'there'
  return {
    subject: 'Your NeuroChiro is ready',
    title: 'Welcome',
    html: `<h1>Welcome to Your NeuroChiro, ${escapeHtml(who)}.</h1>
      <p>Community membership is free. This is your home for finding a nervous system chiropractor, asking for a visit, and keeping your household in one place.</p>
      <p>You decide what is shared. Nothing goes to a doctor until you choose it.</p>`,
    ctaText: 'Open Your NeuroChiro',
    ctaUrl: 'https://neurochiro.co/portal',
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function destinationAfterAuth(role: string | null | undefined): string | null {
  if (isStoredCommunityRole(role)) return HOME_PATH
  return null
}
