import { deriveMembership, type Membership, type MembershipStatus } from '../portal/membership.ts'

export type MemberRole = 'doctor' | 'student' | 'vendor'
export type MemberRoleFilter = '' | MemberRole
export type MemberStatusFilter = '' | 'verified' | 'pending' | 'onboarding' | 'hidden'
export type MemberTierFilter = '' | 'paying' | 'trialing' | 'past_due' | 'founding' | 'free'
export type MemberSort = 'name' | 'recent'
export type BillingLabel = 'Paying' | 'Trialing' | 'Past due' | 'Founding/Comped' | 'Free'

export type MemberQuery = {
  q: string
  role: MemberRoleFilter
  status: MemberStatusFilter
  tier: MemberTierFilter
  state: string
  country: string
  page: number
  pageSize: number
  sort: MemberSort
  member: string
}

export type MemberSearchInput = {
  q?: string
  role?: string
  status?: string
  tier?: string
  state?: string
  country?: string
  page?: number | string
  pageSize?: number | string
  sort?: string
  member?: string
}

export type MemberListRow = {
  id: string
  role: MemberRole
  name: string
  email: string | null
  practice: string | null
  city: string | null
  state: string | null
  country: string | null
  verificationStatus: string | null
  verificationLabel: string
  billingLabel: BillingLabel
  lastActivity: string | null
  slug: string | null
  userId: string | null
}

export type MemberSearchResult = {
  rows: MemberListRow[]
  total: number
}

export type DoctorFormValues = {
  first_name: string
  last_name: string
  email: string
  slug: string
  clinic_name: string
  address: string
  city: string
  state: string
  country: string
  latitude: string
  longitude: string
  bio: string
  website_url: string
  instagram_url: string
  verification_status: string
  short_intro: string
  philosophy: string
  chiropractic_school: string
  graduation_year: string
}

export type MemberRouting = {
  total: number
  last7: number
  last30: number
  lastDate: string | null
  profileClicks: number
  actionClicks: number
  clickRate: number
  actionRate: number
}

export type MemberDetail = {
  id: string
  role: MemberRole
  name: string
  email: string | null
  practice: string | null
  city: string | null
  state: string | null
  country: string | null
  slug: string | null
  userId: string | null
  verificationLabel: string
  billingLabel: BillingLabel
  membershipTier: string
  membershipSource: string
  membershipStatus: string
  needsCall: boolean
  lastSignIn: string
  stripe: {
    customerId: string | null
    unavailable: boolean
    status: string | null
    plan: string | null
    amountLabel: string | null
    renewsAt: string | null
    lastInvoice: string | null
    failedPayments: number | null
  }
  location: { lat: number; lng: number } | null
  doctor: null | {
    form: DoctorFormValues
    contacts: { id: string; name: string; status: string; createdAt: string }[]
    contactTotal: number | null
    introductions: { city: string; state: string; date: string; type: string }[]
    introductionTotal: number
    routing: MemberRouting | null
  }
}

export type BillingSets = {
  active: ReadonlySet<string>
  trialing: ReadonlySet<string>
  pastDue: ReadonlySet<string>
}

const STRING_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'slug',
  'clinic_name',
  'address',
  'city',
  'state',
  'country',
  'bio',
  'website_url',
  'instagram_url',
  'short_intro',
  'philosophy',
  'chiropractic_school',
] as const

const VERIFICATION = new Set(['pending', 'verified', 'hidden', 'rejected'])
const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'])

/** Escape LIKE wildcards. Backslash first so the escapes themselves stay literal. */
export function escapeLikeWildcards(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/**
 * Value for a PostgREST `.or()` ilike clause, including the contains wildcards.
 * The whole value is double-quoted so commas, parentheses, and dots stay inside the value.
 */
export function postgrestOrIlike(value: string): string {
  const escaped = escapeLikeWildcards(value).replace(/"/g, '""')
  return `"%${escaped}%"`
}

export function doctorOrFilter(value: string): string {
  const pattern = postgrestOrIlike(value)
  return ['first_name', 'last_name', 'email', 'clinic_name', 'city', 'state']
    .map((column) => `${column}.ilike.${pattern}`)
    .join(',')
}

export function profileOrFilter(value: string): string {
  const pattern = postgrestOrIlike(value)
  return ['full_name', 'email'].map((column) => `${column}.ilike.${pattern}`).join(',')
}

/** Blank, whitespace, and non-finite coordinates become null. A numeric 0 stays 0. */
export function blankCoordinate(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function blankYear(value: unknown): number | null {
  const parsed = blankCoordinate(value)
  return parsed === null ? null : Math.trunc(parsed)
}

export function pickDoctorPatch(input: Record<string, unknown>): Record<string, string | number | null> {
  const patch: Record<string, string | number | null> = {}
  for (const key of STRING_FIELDS) {
    if (!(key in input)) continue
    const value = input[key]
    if (typeof value === 'string' || value === null) patch[key] = value
  }
  if ('latitude' in input) patch.latitude = blankCoordinate(input.latitude)
  if ('longitude' in input) patch.longitude = blankCoordinate(input.longitude)
  if ('graduation_year' in input) patch.graduation_year = blankYear(input.graduation_year)
  if ('verification_status' in input && typeof input.verification_status === 'string' && VERIFICATION.has(input.verification_status)) {
    patch.verification_status = input.verification_status
  }
  return patch
}

export function needsOnboardingCall(row: {
  is_founding_member?: boolean | null
  is_approved?: boolean | null
  onboarding_call_status?: string | null
}): boolean {
  return row.is_founding_member !== true && row.is_approved !== true && row.onboarding_call_status !== 'completed'
}

export function verificationLabel(status: string | null, needsCall: boolean): string {
  const value = (status || '').toLowerCase()
  if (value === 'hidden' || value === 'rejected') return 'Hidden'
  if (value === 'verified') return 'Verified'
  if (needsCall) return 'Onboarding'
  if (value === 'pending') return 'Pending'
  if (!value) return 'Unknown'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function mapPoint(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const latitude = blankCoordinate(lat)
  const longitude = blankCoordinate(lng)
  if (latitude === null || longitude === null) return null
  if (latitude === 0 && longitude === 0) return null
  return { lat: latitude, lng: longitude }
}

export function staticMapUrl(lat: number, lng: number): string {
  const center = `${lat},${lng}`
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(center)}&zoom=12&size=640x240&markers=${encodeURIComponent(center)},lightblue1`
}

export function chunkIds(ids: string[], size = 150): string[][] {
  const out: string[][] = []
  const unique = [...new Set(ids.filter(Boolean))]
  for (let index = 0; index < unique.length; index += size) out.push(unique.slice(index, index + size))
  return out
}

export function normalizePage(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

export function normalizePageSize(value: unknown): number {
  if (value === undefined || value === null || value === '') return 25
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 25
  return Math.min(25, Math.floor(parsed))
}

export function normalizeRole(value: string | undefined): MemberRoleFilter {
  const role = (value || '').trim().toLowerCase()
  if (role === 'doctor' || role === 'student' || role === 'vendor') return role
  return ''
}

export function normalizeStatus(value: string | undefined): MemberStatusFilter {
  const status = (value || '').trim().toLowerCase()
  if (status === 'verified' || status === 'pending' || status === 'onboarding' || status === 'hidden') return status
  return ''
}

export function normalizeTier(value: string | undefined): MemberTierFilter {
  const tier = (value || '').trim().toLowerCase().replace(/\s+/g, '_')
  if (tier === 'paying' || tier === 'trialing' || tier === 'past_due' || tier === 'founding' || tier === 'free') return tier
  if (tier === 'comped' || tier === 'founding/comped') return 'founding'
  return ''
}

export function normalizeMemberQuery(input: MemberSearchInput): MemberQuery {
  return {
    q: (input.q || '').trim(),
    role: normalizeRole(input.role),
    status: normalizeStatus(input.status),
    tier: normalizeTier(input.tier),
    state: (input.state || '').trim(),
    country: (input.country || '').trim(),
    page: normalizePage(input.page),
    pageSize: normalizePageSize(input.pageSize),
    sort: input.sort === 'recent' ? 'recent' : 'name',
    member: (input.member || '').trim(),
  }
}

export function parseMemberSearchParams(params: Record<string, string | string[] | undefined>): MemberQuery {
  const one = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] || '' : value || ''
  }
  return normalizeMemberQuery({
    q: one('q'),
    role: one('role'),
    status: one('status'),
    tier: one('tier'),
    state: one('state'),
    country: one('country'),
    page: one('page'),
    sort: one('sort'),
    member: one('member'),
  })
}

export function memberHref(query: MemberQuery): string {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.role) params.set('role', query.role)
  if (query.status) params.set('status', query.status)
  if (query.tier) params.set('tier', query.tier)
  if (query.state) params.set('state', query.state)
  if (query.country) params.set('country', query.country)
  if (query.page > 1) params.set('page', String(query.page))
  if (query.member) params.set('member', query.member)
  if (query.sort === 'recent') params.set('sort', 'recent')
  const search = params.toString()
  return search ? `/admin/members?${search}` : '/admin/members'
}

export function liveStripeStatus(customerId: string | null, sets: BillingSets): MembershipStatus | null {
  if (!customerId) return null
  if (sets.active.has(customerId)) return 'active'
  if (sets.trialing.has(customerId)) return 'trialing'
  if (sets.pastDue.has(customerId)) return 'past_due'
  return null
}

export function resolveDoctorBilling(input: {
  customerId: string | null
  sets: BillingSets
  membershipTier: string | null
  profileTier: string | null
  isFoundingMember: boolean | null
  neurosTier: string | null
  createdAt: string | null
  renewsAt?: string | null
}): { label: BillingLabel; membership: Membership } {
  const live = liveStripeStatus(input.customerId, input.sets)
  const shared = {
    membershipTier: input.membershipTier,
    profileTier: input.profileTier,
    isFoundingMember: input.isFoundingMember,
    neurosTier: input.neurosTier,
    createdAt: input.createdAt,
    renewsAt: input.renewsAt || null,
  }
  const withLive = deriveMembership({
    ...shared,
    hasStripeCustomer: Boolean(input.customerId),
    stripeStatus: live,
  })
  const recorded = deriveMembership({
    ...shared,
    hasStripeCustomer: false,
    stripeStatus: null,
  })
  if (live === 'active') return { label: 'Paying', membership: withLive }
  if (live === 'trialing') return { label: 'Trialing', membership: withLive }
  if (live === 'past_due') return { label: 'Past due', membership: withLive }
  if (recorded.source === 'founding' || recorded.source === 'comped') {
    return { label: 'Founding/Comped', membership: recorded }
  }
  return { label: 'Free', membership: recorded }
}

export function resolveProfileBilling(customerId: string | null, sets: BillingSets, profileTier: string | null): { label: BillingLabel; membership: Membership } {
  const live = liveStripeStatus(customerId, sets)
  if (live === 'active' || live === 'trialing' || live === 'past_due') {
    const membership = deriveMembership({
      profileTier: null,
      hasStripeCustomer: true,
      stripeStatus: live,
    })
    const label: BillingLabel = live === 'active' ? 'Paying' : live === 'trialing' ? 'Trialing' : 'Past due'
    return { label, membership }
  }
  const tier = (profileTier || '').toLowerCase()
  if (tier === 'comped' || tier === 'student_comped') {
    return {
      label: 'Founding/Comped',
      membership: deriveMembership({ profileTier: 'comped', hasStripeCustomer: false, stripeStatus: null }),
    }
  }
  return {
    label: 'Free',
    membership: deriveMembership({ profileTier: 'free', hasStripeCustomer: false, stripeStatus: null }),
  }
}

export function billingLabelMatches(label: BillingLabel, tier: MemberTierFilter): boolean {
  if (!tier) return true
  if (tier === 'paying') return label === 'Paying'
  if (tier === 'trialing') return label === 'Trialing'
  if (tier === 'past_due') return label === 'Past due'
  if (tier === 'founding') return label === 'Founding/Comped'
  return label === 'Free'
}

export function compareMembers(a: MemberListRow, b: MemberListRow, sort: MemberSort): number {
  if (sort === 'recent') {
    const left = Date.parse(a.lastActivity || '') || 0
    const right = Date.parse(b.lastActivity || '') || 0
    if (left !== right) return right - left
  }
  const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  if (byName !== 0) return byName
  return a.id.localeCompare(b.id)
}

export function formatMoney(amountMinor: number, currency: string): string {
  const code = (currency || 'usd').toLowerCase()
  const major = ZERO_DECIMAL.has(code) ? amountMinor : amountMinor / 100
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code.toUpperCase() }).format(major)
  } catch {
    return `${major.toFixed(2)} ${code.toUpperCase()}`
  }
}

export function textOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value
}

export function boolOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}
