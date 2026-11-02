'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { looseFrom, type LooseFilter, type PostgrestError } from '@/lib/admin/loose-query'
import { memberBillingSnapshot, stripeCustomerSummary } from '@/lib/admin/member-billing'
import {
  billingLabelMatches,
  boolOrNull,
  chunkIds,
  compareMembers,
  doctorTokenFilters,
  escapeLikeWildcards,
  mapPoint,
  needsOnboardingCall,
  normalizeMemberQuery,
  profileTokenFilters,
  resolveDoctorBilling,
  resolveProfileBilling,
  textOrEmpty,
  textOrNull,
  verificationLabel,
  type BillingSets,
  type DoctorFormValues,
  type MemberDetail,
  type MemberListRow,
  type MemberQuery,
  type MemberRole,
  type MemberRouting,
  type MemberSearchInput,
  type MemberSearchResult,
} from '@/lib/admin/member-search'
import { isMissingColumn } from '@/lib/leads/schema'
import { createAdminClient } from '@/lib/supabase-admin'
import { getDoctorIntroductions } from '@/app/(admin)/admin/directory/actions'
import { getDoctorRoutingStatsForOne } from '@/app/(admin)/admin/stats/doctors/actions'

const DOCTOR_BASE = 'id, user_id, first_name, last_name, email, clinic_name, city, state, country, verification_status, slug, updated_at, created_at'
const DOCTOR_FULL = `${DOCTOR_BASE}, membership_tier, is_founding_member, neuros_tier, onboarding_call_status, is_approved, is_test`
const BILLING_SCAN_CAP = 2000
const BILLING_NOTE = 'Billing filters are slow until the search SQL is run'
const PROFILE_LIST = 'id, full_name, email, role, updated_at, created_at, stripe_customer_id, tier'
const DOCTOR_DETAIL = `${DOCTOR_FULL}, address, latitude, longitude, bio, website_url, instagram_url, short_intro, philosophy, chiropractic_school, graduation_year`

type RpcArgs = {
  q: string | null
  role_filter: string | null
  status_filter: string | null
  state_code: string | null
  country_code: string | null
  page: number
  page_size: number
  sort: string
}

type RpcCall = (fn: 'admin_search_members', args: RpcArgs) => Promise<{ data: unknown; error: PostgrestError }>

function setsFrom(snapshot: { ok: boolean; active: string[]; trialing: string[]; pastDue: string[] }): BillingSets {
  return {
    ok: snapshot.ok,
    active: new Set(snapshot.active),
    trialing: new Set(snapshot.trialing),
    pastDue: new Set(snapshot.pastDue),
  }
}

function chainOr<T extends { or: (filters: string) => T }>(query: T, filters: string[]): T {
  return filters.reduce((next, filter) => next.or(filter), query)
}

function empty(value: string): string | null {
  return value ? value : null
}

function isMissingSearchRpc(error: PostgrestError): boolean {
  if (!error) return false
  if (error.code === 'PGRST202' || error.code === '42883') return true
  const text = `${error.message || ''} ${error.details || ''}`
  return text.includes('admin_search_members')
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function doctorOnlyFilters(query: MemberQuery): boolean {
  return Boolean(query.status || query.state || query.country)
}

function rolesFor(query: MemberQuery): MemberRole[] {
  if (query.role === 'student' || query.role === 'vendor') {
    return doctorOnlyFilters(query) ? [] : [query.role]
  }
  if (query.role === 'doctor' || doctorOnlyFilters(query)) return ['doctor']
  return ['doctor', 'student', 'vendor']
}

function applyDoctorFilters(query: LooseFilter, filters: MemberQuery, hiddenOnly = false): LooseFilter {
  let next = query
  next = chainOr(next, doctorTokenFilters(filters.q))
  if (filters.state) next = next.ilike('state', escapeLikeWildcards(filters.state))
  if (filters.country) next = next.ilike('country', escapeLikeWildcards(filters.country))
  if (filters.status === 'verified') next = next.eq('verification_status', 'verified')
  else if (filters.status === 'pending') next = next.eq('verification_status', 'pending')
  else if (filters.status === 'hidden') {
    next = hiddenOnly ? next.eq('verification_status', 'hidden') : next.in('verification_status', ['hidden', 'rejected'])
  }
  else if (filters.status === 'onboarding') {
    next = next
      .or('onboarding_call_status.is.null,onboarding_call_status.neq.completed')
      .or('is_approved.is.null,is_approved.eq.false')
      .or('is_founding_member.is.null,is_founding_member.eq.false')
  }
  if (filters.sort === 'recent') next = next.order('updated_at', { ascending: false })
  else if (filters.sort === 'newest') next = next.order('created_at', { ascending: false })
  else next = next.order('last_name', { ascending: true }).order('first_name', { ascending: true })
  return next
}

async function doctorPage(admin: unknown, filters: MemberQuery, columns: string, from: number, to: number, hiddenOnly: boolean) {
  const query = applyDoctorFilters(looseFrom(admin, 'doctors').select(columns, { count: 'exact' }), filters, hiddenOnly)
  return query.range(from, to)
}

async function loadDoctors(admin: unknown, filters: MemberQuery, from: number, to: number) {
  let page = await doctorPage(admin, filters, DOCTOR_FULL, from, to, false)
  if (page.error && filters.status === 'hidden') page = await doctorPage(admin, filters, DOCTOR_FULL, from, to, true)
  if (!page.error) return page
  if (!isMissingColumn(page.error) && filters.status !== 'hidden') return page
  if (isMissingColumn(page.error)) {
    page = await doctorPage(admin, filters, DOCTOR_BASE, from, to, false)
    if (page.error && filters.status === 'hidden') page = await doctorPage(admin, filters, DOCTOR_BASE, from, to, true)
  }
  return page
}

function doctorRow(row: Record<string, unknown>, sets: BillingSets, profiles: Map<string, { tier: string | null; stripe_customer_id: string | null }>): MemberListRow {
  const userId = textOrNull(row.user_id)
  const profile = userId ? profiles.get(userId) : undefined
  const needsCall = needsOnboardingCall({
    is_founding_member: boolOrNull(row.is_founding_member),
    is_approved: boolOrNull(row.is_approved),
    onboarding_call_status: textOrNull(row.onboarding_call_status),
  })
  const billing = resolveDoctorBilling({
    customerId: profile?.stripe_customer_id || null,
    sets,
    membershipTier: textOrNull(row.membership_tier),
    profileTier: profile?.tier || null,
    isFoundingMember: boolOrNull(row.is_founding_member),
    neurosTier: textOrNull(row.neuros_tier),
    createdAt: textOrNull(row.created_at),
  })
  const name = `${textOrEmpty(row.first_name)} ${textOrEmpty(row.last_name)}`.trim() || 'Unnamed doctor'
  return {
    id: textOrEmpty(row.id),
    role: 'doctor',
    name,
    email: textOrNull(row.email),
    practice: textOrNull(row.clinic_name),
    city: textOrNull(row.city),
    state: textOrNull(row.state),
    country: textOrNull(row.country),
    verificationStatus: textOrNull(row.verification_status),
    verificationLabel: verificationLabel(textOrNull(row.verification_status), needsCall),
    billingLabel: billing.label,
    lastActivity: textOrNull(row.updated_at) || textOrNull(row.created_at),
    slug: textOrNull(row.slug),
    userId,
    lastName: textOrEmpty(row.last_name),
    firstName: textOrEmpty(row.first_name),
    createdAt: textOrNull(row.created_at),
    isTest: row.is_test === true,
  }
}

function profileRow(row: { id: string; full_name: string | null; email: string; role: string; updated_at: string; created_at: string; stripe_customer_id: string | null; tier: string }, sets: BillingSets): MemberListRow | null {
  if (row.role !== 'student' && row.role !== 'vendor') return null
  const billing = resolveProfileBilling(row.stripe_customer_id, sets, row.tier)
  return {
    id: row.id,
    role: row.role,
    name: row.full_name?.trim() || row.email || 'Unnamed',
    email: row.email || null,
    practice: null,
    city: null,
    state: null,
    country: null,
    verificationStatus: null,
    verificationLabel: row.role === 'student' ? 'Student' : 'Vendor',
    billingLabel: billing.label,
    lastActivity: row.updated_at || row.created_at,
    slug: null,
    userId: row.id,
    lastName: row.full_name?.trim() || row.email || '',
    firstName: '',
    createdAt: row.created_at,
    isTest: false,
  }
}

async function profilesForUsers(admin: ReturnType<typeof createAdminClient>, userIds: string[]) {
  const map = new Map<string, { tier: string | null; stripe_customer_id: string | null }>()
  for (const chunk of chunkIds(userIds)) {
    const { data, error } = await admin.from('profiles').select('id, tier, stripe_customer_id').in('id', chunk)
    if (error) {
      console.error('admin members profiles', error.code || 'error')
      throw new Error('member search failed')
    }
    for (const row of data || []) map.set(row.id, { tier: row.tier, stripe_customer_id: row.stripe_customer_id })
  }
  return map
}

async function collectDoctors(admin: ReturnType<typeof createAdminClient>, filters: MemberQuery, sets: BillingSets, maxRows = 20000): Promise<{ rows: MemberListRow[]; total: number }> {
  const size = 1000
  const records: Record<string, unknown>[] = []
  let total = 0
  for (let from = 0; from < maxRows; from += size) {
    const page = await loadDoctors(admin, filters, from, from + size - 1)
    if (page.error) {
      console.error('admin members doctors', page.error.code || 'error')
      throw new Error('member search failed')
    }
    const batch = page.data || []
    total = page.count ?? total
    records.push(...batch)
    if (batch.length < size || records.length >= maxRows) break
  }
  records.splice(maxRows)
  const profiles = await profilesForUsers(admin, records.map((row) => textOrEmpty(row.user_id)).filter(Boolean))
  const rows = records.map((row) => doctorRow(row, sets, profiles)).filter((row) => row.id)
  return { rows, total: total || rows.length }
}

function orderProfiles<T extends { order: (column: string, options: { ascending: boolean }) => T }>(query: T, sort: MemberQuery['sort']): T {
  if (sort === 'recent') return query.order('updated_at', { ascending: false })
  if (sort === 'newest') return query.order('created_at', { ascending: false })
  return query.order('full_name', { ascending: true })
}

async function collectProfiles(admin: ReturnType<typeof createAdminClient>, role: 'student' | 'vendor', filters: MemberQuery, sets: BillingSets, maxRows = 20000): Promise<{ rows: MemberListRow[]; total: number }> {
  const size = 1000
  const rows: MemberListRow[] = []
  let total = 0
  for (let from = 0; from < maxRows; from += size) {
    let query = admin.from('profiles').select(PROFILE_LIST, { count: 'exact' }).eq('role', role)
    query = chainOr(query, profileTokenFilters(filters.q))
    query = orderProfiles(query, filters.sort)
    const { data, error, count } = await query.range(from, from + size - 1)
    if (error) {
      console.error('admin members profiles', error.code || 'error')
      throw new Error('member search failed')
    }
    total = count ?? total
    for (const row of data || []) {
      const mapped = profileRow(row, sets)
      if (mapped) rows.push(mapped)
    }
    if ((data || []).length < size || rows.length >= maxRows) break
  }
  rows.splice(maxRows)
  return { rows, total: total || rows.length }
}

function pageOf(rows: MemberListRow[], query: MemberQuery, billingOk: boolean, note: string | null): MemberSearchResult {
  const start = (query.page - 1) * query.pageSize
  return { rows: rows.slice(start, start + query.pageSize), total: rows.length, billingOk, note }
}

async function profilePage(admin: ReturnType<typeof createAdminClient>, role: 'student' | 'vendor', query: MemberQuery, sets: BillingSets, from: number, to: number) {
  let request = admin.from('profiles').select(PROFILE_LIST, { count: 'exact' }).eq('role', role)
  request = chainOr(request, profileTokenFilters(query.q))
  request = orderProfiles(request, query.sort)
  const { data, error, count } = await request.range(from, to)
  if (error) {
    console.error('admin members profiles', error.code || 'error')
    throw new Error('member search failed')
  }
  return {
    rows: (data || []).map((row) => profileRow(row, sets)).filter((row): row is MemberListRow => Boolean(row)),
    total: count || 0,
  }
}

async function searchFallback(admin: ReturnType<typeof createAdminClient>, query: MemberQuery, sets: BillingSets): Promise<MemberSearchResult> {
  const roles = rolesFor(query)
  const note = query.tier ? BILLING_NOTE : null
  if (roles.length === 0) return { rows: [], total: 0, billingOk: sets.ok, note }
  if (query.tier) {
    const buckets: MemberListRow[] = []
    for (const role of roles) {
      if (role === 'doctor') {
        const doctors = await collectDoctors(admin, query, sets, BILLING_SCAN_CAP)
        buckets.push(...doctors.rows)
      } else {
        const people = await collectProfiles(admin, role, query, sets, BILLING_SCAN_CAP)
        buckets.push(...people.rows)
      }
    }
    const filtered = buckets.filter((row) => billingLabelMatches(row.billingLabel, query.tier))
    filtered.sort((a, b) => compareMembers(a, b, query.sort))
    return pageOf(filtered, query, sets.ok, note)
  }

  const from = (query.page - 1) * query.pageSize
  const to = from + query.pageSize - 1
  if (roles.length === 1 && roles[0] === 'doctor') {
    const page = await loadDoctors(admin, query, from, to)
    if (page.error) {
      console.error('admin members doctors', page.error.code || 'error')
      throw new Error('member search failed')
    }
    const profiles = await profilesForUsers(admin, (page.data || []).map((row) => textOrEmpty(row.user_id)).filter(Boolean))
    return {
      rows: (page.data || []).map((row) => doctorRow(row, sets, profiles)).filter((row) => row.id),
      total: page.count || 0,
      billingOk: sets.ok,
      note: null,
    }
  }
  if (roles.length === 1) {
    const only = roles[0]
    if (only === 'student' || only === 'vendor') {
      const page = await profilePage(admin, only, query, sets, from, to)
      return { rows: page.rows, total: page.total, billingOk: sets.ok, note: null }
    }
  }

  const buckets: MemberListRow[] = []
  let total = 0
  for (const role of roles) {
    if (role === 'doctor') {
      const page = await loadDoctors(admin, query, from, to)
      if (page.error) {
        console.error('admin members doctors', page.error.code || 'error')
        throw new Error('member search failed')
      }
      total += page.count || 0
      const profiles = await profilesForUsers(admin, (page.data || []).map((row) => textOrEmpty(row.user_id)).filter(Boolean))
      buckets.push(...(page.data || []).map((row) => doctorRow(row, sets, profiles)).filter((row) => row.id))
    } else {
      const page = await profilePage(admin, role, query, sets, from, to)
      total += page.total
      buckets.push(...page.rows)
    }
  }
  buckets.sort((a, b) => compareMembers(a, b, query.sort))
  return { rows: buckets.slice(0, query.pageSize), total, billingOk: sets.ok, note: null }
}

function rowFromRpc(row: Record<string, unknown>, sets: BillingSets): MemberListRow | null {
  const id = textOrNull(row.id)
  const role = textOrNull(row.member_role)
  if (!id || (role !== 'doctor' && role !== 'student' && role !== 'vendor')) return null
  if (role === 'doctor') {
    const needsCall = needsOnboardingCall({
      is_founding_member: boolOrNull(row.is_founding_member),
      is_approved: boolOrNull(row.is_approved),
      onboarding_call_status: textOrNull(row.onboarding_call_status),
    })
    const billing = resolveDoctorBilling({
      customerId: textOrNull(row.stripe_customer_id),
      sets,
      membershipTier: textOrNull(row.membership_tier),
      profileTier: textOrNull(row.profile_tier),
      isFoundingMember: boolOrNull(row.is_founding_member),
      neurosTier: textOrNull(row.neuros_tier),
      createdAt: textOrNull(row.member_created_at),
    })
    return {
      id,
      role,
      name: textOrEmpty(row.full_name) || 'Unnamed doctor',
      email: textOrNull(row.email),
      practice: textOrNull(row.practice),
      city: textOrNull(row.city),
      state: textOrNull(row.member_state),
      country: textOrNull(row.member_country),
      verificationStatus: textOrNull(row.verification_status),
      verificationLabel: verificationLabel(textOrNull(row.verification_status), needsCall),
      billingLabel: billing.label,
      lastActivity: textOrNull(row.last_activity),
      slug: textOrNull(row.slug),
      userId: textOrNull(row.user_id),
      lastName: textOrEmpty(row.full_name),
      firstName: '',
      createdAt: textOrNull(row.member_created_at),
      isTest: false,
    }
  }
  const billing = resolveProfileBilling(textOrNull(row.stripe_customer_id), sets, textOrNull(row.profile_tier))
  return {
    id,
    role,
    name: textOrEmpty(row.full_name) || textOrEmpty(row.email) || 'Unnamed',
    email: textOrNull(row.email),
    practice: null,
    city: null,
    state: null,
    country: null,
    verificationStatus: null,
    verificationLabel: role === 'student' ? 'Student' : 'Vendor',
    billingLabel: billing.label,
    lastActivity: textOrNull(row.last_activity),
    slug: null,
    userId: textOrNull(row.user_id) || id,
    lastName: textOrEmpty(row.full_name) || textOrEmpty(row.email),
    firstName: '',
    createdAt: textOrNull(row.member_created_at),
    isTest: false,
  }
}

type RpcOutcome = { status: 'ok'; result: MemberSearchResult } | { status: 'missing' } | { status: 'error' }

async function searchRpc(admin: ReturnType<typeof createAdminClient>, query: MemberQuery, sets: BillingSets): Promise<RpcOutcome> {
  const rpc = (admin as unknown as { rpc: RpcCall }).rpc
  let data: unknown
  let error: PostgrestError
  try {
    const result = await rpc.call(admin, 'admin_search_members', {
      q: empty(query.q),
      role_filter: empty(query.role),
      status_filter: empty(query.status),
      state_code: empty(query.state),
      country_code: empty(query.country),
      page: query.page,
      page_size: query.pageSize,
      sort: query.sort,
    })
    data = result.data
    error = result.error
  } catch (err) {
    console.error('admin members rpc', err instanceof Error ? err.name : 'error')
    return { status: 'error' }
  }
  if (error) {
    if (isMissingSearchRpc(error)) return { status: 'missing' }
    console.error('admin members rpc', error.code || 'error')
    return { status: 'error' }
  }
  if (!Array.isArray(data)) return { status: 'error' }
  const records = data.map(asRecord).filter((row): row is Record<string, unknown> => Boolean(row))
  const total = records.length ? asCount(records[0].total_count) : 0
  const rows = records.map((row) => rowFromRpc(row, sets)).filter((row): row is MemberListRow => Boolean(row))
  const doctorIds = rows.filter((row) => row.role === 'doctor').map((row) => row.id)
  if (doctorIds.length > 0) {
    const flags = await looseFrom(admin, 'doctors').select('id, is_test').in('id', doctorIds)
    if (!flags.error) {
      const testIds = new Set((flags.data || []).filter((row) => row.is_test === true).map((row) => textOrEmpty(row.id)).filter(Boolean))
      for (const row of rows) row.isTest = testIds.has(row.id)
    }
  }
  return { status: 'ok', result: { rows, total, billingOk: sets.ok, note: null } }
}

export async function searchMembers(input: MemberSearchInput): Promise<MemberSearchResult> {
  await checkAdminAuth()
  const query = normalizeMemberQuery(input)
  const admin = createAdminClient()
  const snapshot = await memberBillingSnapshot()
  const sets = setsFrom(snapshot)
  if (!query.tier) {
    const rpc = await searchRpc(admin, query, sets)
    if (rpc.status === 'ok') return rpc.result
    if (rpc.status === 'error') throw new Error('member search failed')
  }
  return searchFallback(admin, query, sets)
}

function formText(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return textOrEmpty(value)
}

async function loadDoctorDetail(admin: ReturnType<typeof createAdminClient>, memberId: string, sets: BillingSets): Promise<MemberDetail | null> {
  let rowResult = await looseFrom(admin, 'doctors').select(DOCTOR_DETAIL).eq('id', memberId).limit(1)
  if (rowResult.error && isMissingColumn(rowResult.error)) {
    rowResult = await looseFrom(admin, 'doctors').select(DOCTOR_BASE).eq('id', memberId).limit(1)
  }
  if (rowResult.error) {
    console.error('admin member detail', rowResult.error.code || 'error')
    return null
  }
  const row = rowResult.data?.[0]
  if (!row) return null
  const userId = textOrNull(row.user_id)
  const profiles = userId ? await profilesForUsers(admin, [userId]) : new Map()
  const list = doctorRow(row, sets, profiles)
  const profile = userId ? profiles.get(userId) : undefined
  const customerId = profile?.stripe_customer_id || null
  const billing = resolveDoctorBilling({
    customerId,
    sets,
    membershipTier: textOrNull(row.membership_tier),
    profileTier: profile?.tier || null,
    isFoundingMember: boolOrNull(row.is_founding_member),
    neurosTier: textOrNull(row.neuros_tier),
    createdAt: textOrNull(row.created_at),
  })
  const needsCall = needsOnboardingCall({
    is_founding_member: boolOrNull(row.is_founding_member),
    is_approved: boolOrNull(row.is_approved),
    onboarding_call_status: textOrNull(row.onboarding_call_status),
  })
  const [contacts, contactCount, introductions, routing, stripeSummary, lastSignIn] = await Promise.all([
    looseFrom(admin, 'contact_requests').select('id, name, status, created_at').eq('doctor_id', memberId).order('created_at', { ascending: false }).limit(10),
    looseFrom(admin, 'contact_requests').select('id', { count: 'exact', head: true }).eq('doctor_id', memberId),
    getDoctorIntroductions(memberId),
    getDoctorRoutingStatsForOne(memberId),
    customerId ? stripeCustomerSummary(customerId) : Promise.resolve(null),
    lastSignInAt(admin, userId),
  ])
  const form: DoctorFormValues = {
    first_name: textOrEmpty(row.first_name),
    last_name: textOrEmpty(row.last_name),
    email: textOrEmpty(row.email),
    slug: textOrEmpty(row.slug),
    clinic_name: textOrEmpty(row.clinic_name),
    address: textOrEmpty(row.address),
    city: textOrEmpty(row.city),
    state: textOrEmpty(row.state),
    country: textOrEmpty(row.country),
    latitude: formText(row.latitude),
    longitude: formText(row.longitude),
    bio: textOrEmpty(row.bio),
    website_url: textOrEmpty(row.website_url),
    instagram_url: textOrEmpty(row.instagram_url),
    verification_status: textOrEmpty(row.verification_status),
    short_intro: textOrEmpty(row.short_intro),
    philosophy: textOrEmpty(row.philosophy),
    chiropractic_school: textOrEmpty(row.chiropractic_school),
    graduation_year: formText(row.graduation_year),
  }
  const location = mapPoint(row.latitude, row.longitude)
  const routingView: MemberRouting | null = routing
    ? {
        total: routing.total,
        last7: routing.last7,
        last30: routing.last30,
        lastDate: routing.lastDate,
        profileClicks: routing.profile_clicks,
        actionClicks: routing.action_clicks,
        clickRate: routing.click_rate,
        actionRate: routing.action_rate,
      }
    : null
  return {
    ...list,
    billingLabel: billing.label,
    membershipTier: billing.membership.tier,
    membershipSource: billing.membership.source,
    membershipStatus: billing.membership.status,
    needsCall,
    lastSignIn,
    stripe: {
      customerId,
      unavailable: Boolean(customerId) && !stripeSummary,
      status: stripeSummary?.status || null,
      plan: stripeSummary?.plan || null,
      amountLabel: stripeSummary?.amountLabel || null,
      renewsAt: stripeSummary?.renewsAt || null,
      lastInvoice: stripeSummary?.lastInvoice || null,
      failedPayments: stripeSummary ? stripeSummary.failedPayments : null,
    },
    location,
    doctor: {
      form,
      contacts: contacts.error
        ? []
        : (contacts.data || []).map((item) => ({
            id: textOrEmpty(item.id),
            name: textOrEmpty(item.name) || 'Unnamed',
            status: textOrEmpty(item.status) || 'unknown',
            createdAt: textOrEmpty(item.created_at),
          })),
      contactTotal: contactCount.error ? null : contactCount.count || 0,
      introductions: introductions.slice(0, 10),
      introductionTotal: introductions.length,
      routing: routingView,
    },
  }
}

async function lastSignInAt(admin: ReturnType<typeof createAdminClient>, userId: string | null): Promise<string> {
  if (!userId) return 'Unavailable'
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (error || !data.user) return 'Unavailable'
    return data.user.last_sign_in_at || 'No sign-in yet'
  } catch (err) {
    console.error('admin member sign-in', err instanceof Error ? err.name : 'error')
    return 'Unavailable'
  }
}

async function loadProfileDetail(admin: ReturnType<typeof createAdminClient>, memberId: string, sets: BillingSets): Promise<MemberDetail | null> {
  const { data, error } = await admin.from('profiles').select(PROFILE_LIST).eq('id', memberId).maybeSingle()
  if (error || !data) return null
  const row = profileRow(data, sets)
  if (!row) return null
  const billing = resolveProfileBilling(data.stripe_customer_id, sets, data.tier)
  const summary = data.stripe_customer_id ? await stripeCustomerSummary(data.stripe_customer_id) : null
  return {
    ...row,
    billingLabel: billing.label,
    membershipTier: billing.membership.tier,
    membershipSource: billing.membership.source,
    membershipStatus: billing.membership.status,
    needsCall: false,
    lastSignIn: await lastSignInAt(admin, data.id),
    stripe: {
      customerId: data.stripe_customer_id,
      unavailable: Boolean(data.stripe_customer_id) && !summary,
      status: summary?.status || null,
      plan: summary?.plan || null,
      amountLabel: summary?.amountLabel || null,
      renewsAt: summary?.renewsAt || null,
      lastInvoice: summary?.lastInvoice || null,
      failedPayments: summary ? summary.failedPayments : null,
    },
    location: null,
    doctor: null,
  }
}

export async function loadMemberDetail(memberId: string): Promise<MemberDetail | null> {
  await checkAdminAuth()
  const id = memberId.trim()
  if (!id) return null
  const admin = createAdminClient()
  const sets = setsFrom(await memberBillingSnapshot())
  const doctor = await loadDoctorDetail(admin, id, sets)
  if (doctor) return doctor
  return loadProfileDetail(admin, id, sets)
}
