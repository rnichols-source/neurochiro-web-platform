import 'server-only'

import { cache } from 'react'
import { normalizeCountry, normalizeState } from '@/lib/admin/geo-normalize'
import { fetchAllRows, createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn } from '@/lib/leads/schema'
import { countryName } from './format'

export type MentionPoint = { lat: number; lng: number; country: string }

export type DoctorRecord = {
  id: string
  userId: string | null
  name: string
  clinic: string
  email: string | null
  phone: string | null
  city: string
  state: string
  country: string
  lat: number | null
  lng: number | null
  verified: boolean
  founding: boolean
  tier: string
  createdAt: string | null
  views: number
  slug: string | null
  photo: boolean
  priceText: string | null
  sms: boolean
  test: boolean
}

export type RequestRecord = {
  id: string
  doctorId: string | null
  subscriberId: string | null
  name: string
  email: string | null
  phone: string | null
  status: string
  createdAt: string
  acknowledgedAt: string | null
  outcome: string | null
  source: string | null
  checkinSent: string | null
  checkinResponse: string | null
  smsConsent: boolean
  smsPhone: string | null
  officeResponse: string | null
  officeSent: string | null
}

export type PersonRecord = {
  id: string
  name: string
  email: string | null
  role: string
  lastSignIn: string | null
  createdAt: string | null
  test: boolean
}

export type ApplicationRecord = {
  id: string
  userId: string | null
  status: string
  city: string
  state: string
  country: string
  createdAt: string | null
  step: number | null
  plan: string | null
  price: string | null
}

export type SubscriberRecord = {
  id: string
  email: string
  status: string
  state: string
  country: string
  lat: number | null
  lng: number | null
  confirmed: boolean
  sms: boolean
  smsPhone: string | null
}

export type Cluster = { lat: number; lng: number; n: number }
export type GapCity = { city: string; state: string; country: string; n: number; miles: number; lat: number; lng: number }
export type CountRow = { label: string; n: number }

export type OfficeTracking = { ready: boolean; yes: number; no: number; sent: number }

export type FounderRoster = {
  generatedAt: string
  mentionsOk: boolean
  demandCount: number
  points: MentionPoint[]
  clusters: Cluster[]
  cities: number
  countries: CountRow[]
  states: CountRow[]
  gaps: GapCity[]
  gapAsks: number
  unmeasured: number
  sources: CountRow[]
  posts: CountRow[]
  doctors: DoctorRecord[]
  requests: RequestRecord[]
  people: PersonRecord[]
  applications: ApplicationRecord[]
  subscribers: SubscriberRecord[]
  searches: number | null
  profileViews: number | null
  bookTaps: number | null
  callTaps: number | null
  communityVisits: number | null
  office: OfficeTracking
}

const DOCTOR_COLUMNS = 'id, user_id, first_name, last_name, clinic_name, email, phone, city, state, country, latitude, longitude, verification_status, membership_tier, is_founding_member, is_test, created_at, profile_views, slug, photo_url, first_visit_price, sms_alerts_enabled, lead_alert_phones'
const REQUEST_COLUMNS = 'id, doctor_id, subscriber_id, name, email, phone, status, created_at, acknowledged_at, contact_outcome, source, patient_checkin_sent_at, patient_checkin_response, sms_consent, sms_phone'
const MENTION_COLUMNS = 'city, state, country, lat, lng, source, post_ref, nearest_distance_mi, repeat_count'

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function flag(value: unknown): boolean {
  return value === true || value === 'true' || value === 't' || value === 1
}

function coord(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number === 0) return null
  return number
}

async function headCount(table: string, column: string, value: string): Promise<number | null> {
  const admin = createAdminClient() as any
  const { count, error } = await admin.from(table).select(column, { count: 'exact', head: true }).eq(column, value)
  if (error) return null
  return count ?? 0
}

function addCount(map: Map<string, number>, key: string, amount = 1) {
  if (!key) return
  map.set(key, (map.get(key) || 0) + amount)
}

function topCounts(map: Map<string, number>, limit: number): CountRow[] {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([label, n]) => ({ label, n }))
}

export const loadFounderRoster = cache(async (): Promise<FounderRoster> => {
  const admin = createAdminClient() as any
  const officeProbe = await admin.from('contact_requests').select('office_visit_response, office_visit_sent_at').limit(1)
  const officeReady = !officeProbe.error
  const requestColumns = officeReady ? `${REQUEST_COLUMNS}, office_visit_response, office_visit_sent_at` : REQUEST_COLUMNS

  const [mentionRows, doctorRows, requestRows, profileRows, applicationRows, subscriberRows, searches, profileViews, bookTaps, callTaps] = await Promise.all([
    fetchAllRows(admin, 'demand_mentions', MENTION_COLUMNS).catch(() => []),
    fetchAllRows(admin, 'doctors', DOCTOR_COLUMNS).catch(() => []),
    fetchAllRows(admin, 'contact_requests', requestColumns).catch(() => []),
    fetchAllRows(admin, 'profiles', 'id, full_name, email, role, is_test, last_sign_in_at, created_at').catch(() => []),
    fetchAllRows(admin, 'doctor_applications', 'id, user_id, status, city, state, country, created_at, step_reached, plan, price_label').catch(() => []),
    fetchAllRows(admin, 'subscribers', 'id, email, status, state, country, latitude, longitude, sms_consent, sms_phone').catch(() => []),
    headCount('site_activity', 'event_type', 'search'),
    headCount('site_activity', 'event_type', 'profile_view'),
    headCount('conversion_events', 'event_type', 'book'),
    headCount('conversion_events', 'event_type', 'call'),
  ])
  let communityVisits: number | null = null
  const visitCount = await admin.from('community_visit_requests').select('id', { count: 'exact', head: true })
  communityVisits = visitCount.error ? null : visitCount.count ?? 0

  const mentionsOk = mentionRows.length > 0 || (await admin.from('demand_mentions').select('id', { count: 'exact', head: true })).count === 0
  const doctors = (doctorRows as any[]).map(mapDoctor)
  const testDoctors = new Set(doctors.filter((doctor) => doctor.test).map((doctor) => doctor.id))
  const requests = (requestRows as any[]).map(mapRequest).filter((row) => !row.doctorId || !testDoctors.has(row.doctorId))
  const demand = summarizeMentions(mentionRows as any[])

  let office: OfficeTracking = { ready: false, yes: 0, no: 0, sent: 0 }
  if (officeReady) {
    for (const row of requests) {
      if (row.officeSent) office.sent += 1
      if (row.officeResponse === 'yes') office.yes += 1
      if (row.officeResponse === 'no') office.no += 1
    }
    office.ready = true
  } else if (officeProbe.error && !isMissingColumn(officeProbe.error)) {
    office = { ready: false, yes: 0, no: 0, sent: 0 }
  }

  return {
    generatedAt: new Date().toISOString(),
    mentionsOk,
    demandCount: demand.demandCount,
    points: demand.points,
    clusters: demand.clusters,
    cities: demand.cities,
    countries: demand.countries,
    states: demand.states,
    gaps: demand.gaps,
    gapAsks: demand.gapAsks,
    unmeasured: demand.unmeasured,
    sources: demand.sources,
    posts: demand.posts,
    doctors: doctors.filter((doctor) => !doctor.test),
    requests,
    people: (profileRows as any[]).map(mapPerson).filter((person) => !person.test),
    applications: (applicationRows as any[]).map(mapApplication),
    subscribers: (subscriberRows as any[]).map(mapSubscriber).filter((row) => row.email),
    searches,
    profileViews,
    bookTaps,
    callTaps,
    communityVisits,
    office,
  }
})

function mapDoctor(row: any): DoctorRecord {
  const phones = Array.isArray(row.lead_alert_phones) ? row.lead_alert_phones.filter((item: unknown) => typeof item === 'string' && item) : []
  const first = text(row.first_name).replace(/^dr\.?\s+/i, '')
  const last = text(row.last_name)
  const full = [first, last].filter(Boolean).join(' ')
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    name: full ? `Dr. ${full}` : 'Doctor',
    clinic: text(row.clinic_name),
    email: text(row.email) || null,
    phone: text(row.phone) || phones[0] || null,
    city: text(row.city),
    state: normalizeState(text(row.state), normalizeCountry(text(row.country)) || 'US'),
    country: normalizeCountry(text(row.country)) || 'US',
    lat: coord(row.latitude),
    lng: coord(row.longitude),
    verified: text(row.verification_status) === 'verified',
    founding: flag(row.is_founding_member),
    tier: text(row.membership_tier),
    createdAt: row.created_at ? String(row.created_at) : null,
    views: Number(row.profile_views) || 0,
    slug: text(row.slug) || null,
    photo: Boolean(text(row.photo_url)),
    priceText: text(row.first_visit_price) || null,
    sms: flag(row.sms_alerts_enabled) && Boolean(text(row.phone) || phones[0]),
    test: flag(row.is_test),
  }
}

function mapRequest(row: any): RequestRecord {
  return {
    id: String(row.id),
    doctorId: row.doctor_id ? String(row.doctor_id) : null,
    subscriberId: row.subscriber_id ? String(row.subscriber_id) : null,
    name: text(row.name),
    email: text(row.email) || null,
    phone: text(row.phone) || null,
    status: text(row.status) || 'new',
    createdAt: String(row.created_at || ''),
    acknowledgedAt: row.acknowledged_at ? String(row.acknowledged_at) : null,
    outcome: text(row.contact_outcome) || null,
    source: text(row.source) || null,
    checkinSent: row.patient_checkin_sent_at ? String(row.patient_checkin_sent_at) : null,
    checkinResponse: text(row.patient_checkin_response) || null,
    smsConsent: flag(row.sms_consent),
    smsPhone: text(row.sms_phone) || null,
    officeResponse: text(row.office_visit_response) || null,
    officeSent: row.office_visit_sent_at ? String(row.office_visit_sent_at) : null,
  }
}

function mapPerson(row: any): PersonRecord {
  return {
    id: String(row.id),
    name: text(row.full_name) || 'Unnamed',
    email: text(row.email) || null,
    role: text(row.role),
    lastSignIn: row.last_sign_in_at ? String(row.last_sign_in_at) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    test: flag(row.is_test),
  }
}

function mapApplication(row: any): ApplicationRecord {
  const step = Number(row.step_reached)
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    status: text(row.status) || 'unknown',
    city: text(row.city),
    state: text(row.state),
    country: text(row.country),
    createdAt: row.created_at ? String(row.created_at) : null,
    step: Number.isFinite(step) ? step : null,
    plan: text(row.plan) || null,
    price: text(row.price_label) || null,
  }
}

function mapSubscriber(row: any): SubscriberRecord {
  const status = text(row.status)
  return {
    id: String(row.id),
    email: text(row.email).toLowerCase(),
    status,
    state: text(row.state),
    country: normalizeCountry(text(row.country)),
    lat: coord(row.latitude),
    lng: coord(row.longitude),
    confirmed: status === 'confirmed',
    sms: flag(row.sms_consent) && Boolean(text(row.sms_phone)),
    smsPhone: text(row.sms_phone) || null,
  }
}

function summarizeMentions(rows: any[]) {
  const points: MentionPoint[] = []
  const cities = new Set<string>()
  const countryMap = new Map<string, number>()
  const stateMap = new Map<string, number>()
  const sourceMap = new Map<string, number>()
  const postMap = new Map<string, number>()
  const grid = new Map<string, { lat: number; lng: number; n: number }>()
  const gapMap = new Map<string, GapCity>()
  let demandCount = 0
  let gapAsks = 0
  let unmeasured = 0

  for (const row of rows) {
    const weight = 1
    demandCount += weight
    const country = normalizeCountry(text(row.country)) || 'US'
    const state = normalizeState(text(row.state), country)
    const city = text(row.city)
    addCount(countryMap, countryName(country), weight)
    if (country === 'US' && state) addCount(stateMap, state, weight)
    addCount(sourceMap, text(row.source) || 'unspecified', weight)
    if (text(row.post_ref)) addCount(postMap, text(row.post_ref), weight)
    if (city) cities.add(`${city.toLowerCase()}|${state}|${country}`)
    const lat = coord(row.lat)
    const lng = coord(row.lng)
    const miles = Number(row.nearest_distance_mi)
    if (row.nearest_distance_mi == null || row.nearest_distance_mi === '') unmeasured += weight
    else if (Number.isFinite(miles) && miles >= 50) {
      gapAsks += weight
      if (city && lat != null && lng != null) {
        const key = `${city.toLowerCase()}|${state}|${country}`
        const prior = gapMap.get(key)
        if (!prior) gapMap.set(key, { city, state, country, n: weight, miles: Math.round(miles), lat, lng })
        else {
          prior.n += weight
          prior.miles = Math.min(prior.miles, Math.round(miles))
        }
      }
    }
    if (lat == null || lng == null) continue
    points.push({ lat, lng, country })
    const gx = Math.round(lat / 0.45) * 0.45
    const gy = Math.round(lng / 0.45) * 0.45
    const key = `${gx}|${gy}`
    const cell = grid.get(key)
    if (!cell) grid.set(key, { lat, lng, n: weight })
    else {
      cell.n += weight
      cell.lat = (cell.lat * (cell.n - weight) + lat * weight) / cell.n
      cell.lng = (cell.lng * (cell.n - weight) + lng * weight) / cell.n
    }
  }

  return {
    demandCount,
    points,
    clusters: [...grid.values()],
    cities: cities.size,
    countries: topCounts(countryMap, 12),
    states: topCounts(stateMap, 7),
    gaps: [...gapMap.values()].sort((a, b) => b.n - a.n || a.miles - b.miles).slice(0, 24),
    gapAsks,
    unmeasured,
    sources: topCounts(sourceMap, 8),
    posts: topCounts(postMap, 8),
  }
}
