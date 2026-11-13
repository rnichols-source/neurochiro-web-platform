import { haversineDistance } from '@/lib/geo'
import { doctorHealth, type HealthTone } from './health-score'
import { barPercent, daysUntil, formatHours, FOUNDING_END, lastWeeks, median, parseVisitPrice, weekStart } from './format'
import type { DoctorRecord, FounderRoster, PersonRecord, RequestRecord } from './roster'

const HOUR = 3_600_000
const WAITING = 48 * HOUR

export type FunnelStep = {
  label: string
  detail: string
  value: string
  width: number
  tone: 'growth' | 'people' | 'pulse'
  tracking: boolean
}

export type NeedItem = {
  id: string
  title: string
  detail: string
  action: string
  href: string
  tone: 'alert' | 'people' | 'growth' | 'money'
}

export function openRequests(roster: FounderRoster, now = new Date()): RequestRecord[] {
  return roster.requests.filter((row) => row.status !== 'withdrawn' && row.createdAt && new Date(row.createdAt).getTime() <= now.getTime())
}

export function waitingRequests(roster: FounderRoster, now = new Date()): RequestRecord[] {
  return openRequests(roster, now).filter((row) => {
    if (row.acknowledgedAt) return false
    return now.getTime() - new Date(row.createdAt).getTime() >= WAITING
  })
}

export function liveDoctors(roster: FounderRoster): DoctorRecord[] {
  return roster.doctors.filter((doctor) => doctor.verified && doctor.lat != null && doctor.lng != null)
}

function hoursBetween(start: string, end: string): number | null {
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  return (b - a) / HOUR
}

export function buildFunnel(roster: FounderRoster, now = new Date()): FunnelStep[] {
  const open = openRequests(roster, now)
  const replied = open.filter((row) => row.acknowledgedAt)
  const confirmed = open.filter((row) => row.outcome === 'patient_contacted_confirmed')
  const reached = open.filter((row) => row.checkinResponse === 'reached')
  const asked = open.filter((row) => row.checkinSent)
  const max = Math.max(roster.demandCount, roster.searches || 0, roster.profileViews || 0, 1)
  const book = (roster.bookTaps || 0) + (roster.callTaps || 0)
  const visitTotal = open.length + (roster.communityVisits || 0)
  const steps: FunnelStep[] = [
    { label: 'Asked for a doctor', detail: 'IG comments + coverage searches', value: String(roster.demandCount), width: barPercent(roster.demandCount, max), tone: 'growth', tracking: false },
    { label: 'Searched the directory', detail: 'site searches', value: roster.searches == null ? '—' : String(roster.searches), width: barPercent(roster.searches || 0, max), tone: 'growth', tracking: false },
    { label: 'Viewed a doctor', detail: 'profile views (tracked)', value: roster.profileViews == null ? '—' : String(roster.profileViews), width: barPercent(roster.profileViews || 0, max), tone: 'growth', tracking: false },
    { label: 'Tapped book / call', detail: roster.bookTaps == null ? 'book and call taps' : `${roster.bookTaps} book · ${roster.callTaps ?? 0} call`, value: roster.bookTaps == null ? '—' : String(book), width: barPercent(book, max), tone: 'people', tracking: false },
    { label: 'Requested a visit', detail: `${new Set(open.map((row) => row.doctorId).filter(Boolean)).size} doctors${roster.communityVisits ? ` · ${roster.communityVisits} community-portal` : ''}`, value: String(visitTotal), width: barPercent(visitTotal, max), tone: 'pulse', tracking: false },
    { label: 'Doctor replied', detail: visitTotal ? `${Math.round((replied.length / visitTotal) * 100)}% replied` : 'no requests yet', value: String(replied.length), width: barPercent(replied.length, max), tone: 'pulse', tracking: false },
    { label: 'Contact confirmed', detail: visitTotal ? `${Math.round((confirmed.length / visitTotal) * 100)}% of requests` : 'no requests yet', value: String(confirmed.length), width: barPercent(confirmed.length, max), tone: 'pulse', tracking: false },
  ]
  if (!roster.office.ready) {
    steps.push({
      label: 'Went into the office',
      detail: asked.length ? `${reached.length} said the office reached them, of ${asked.length} asked. That is not an office visit.` : 'No office-visit answers yet.',
      value: '?',
      width: 18,
      tone: 'pulse',
      tracking: true,
    })
  } else if (roster.office.sent === 0 && roster.office.yes === 0) {
    steps.push({
      label: 'Went into the office',
      detail: 'The question is ready. Nothing has been sent.',
      value: '0',
      width: 12,
      tone: 'pulse',
      tracking: true,
    })
  } else {
    steps.push({
      label: 'Went into the office',
      detail: `${roster.office.yes} yes · ${roster.office.no} no · ${roster.office.sent} asked`,
      value: String(roster.office.yes),
      width: barPercent(roster.office.yes, max),
      tone: 'pulse',
      tracking: false,
    })
  }
  return steps
}

export function buildNeeds(roster: FounderRoster, now = new Date()): NeedItem[] {
  const waiting = waitingRequests(roster, now)
  const doctors = new Set(waiting.map((row) => row.doctorId).filter(Boolean))
  const review = roster.applications.filter((row) => row.status === 'under_review')
  const drafts = roster.applications.filter((row) => row.status === 'draft')
  const days = daysUntil(now, FOUNDING_END)
  const founding = roster.doctors.filter((doctor) => doctor.founding).length
  const needs: NeedItem[] = []
  if (waiting.length) {
    needs.push({
      id: 'waiting',
      title: `${waiting.length} visit request${waiting.length === 1 ? '' : 's'} waiting 48h+`,
      detail: `at ${doctors.size} doctor${doctors.size === 1 ? '' : 's'} · nudge or reroute`,
      action: `Nudge all ${doctors.size}`,
      href: '/admin/people?filter=ignoring',
      tone: 'alert',
    })
  }
  if (review.length || drafts.length) {
    needs.push({
      id: 'applications',
      title: `${review.length} application${review.length === 1 ? '' : 's'} to review${drafts.length ? ` · ${drafts.length} stalled draft${drafts.length === 1 ? '' : 's'}` : ''}`,
      detail: 'drafts stopped before payment',
      action: 'Review',
      href: '/admin/applications',
      tone: 'people',
    })
  }
  if (roster.gapAsks) {
    const names = roster.gaps.slice(0, 3).map((gap) => gap.city).join(', ')
    needs.push({
      id: 'gaps',
      title: `${roster.gapAsks} asks are 50+ miles from a doctor`,
      detail: names || 'Measured mentions only',
      action: 'See targets',
      href: '/admin/growth#targets',
      tone: 'growth',
    })
  }
  if (days > 0) {
    needs.push({
      id: 'founding',
      title: `Founding rate ends Dec 1 · ${days} day${days === 1 ? '' : 's'}`,
      detail: `${founding} founding members · send the heads-up`,
      action: 'Draft email',
      href: '/admin/money#heads-up',
      tone: 'money',
    })
  }
  return needs
}

export function weekSeries(roster: FounderRoster, now = new Date()): { label: string; n: number }[] {
  const weeks = lastWeeks(now, 8)
  const counts = new Map(weeks.map((week) => [week.start, 0]))
  for (const row of openRequests(roster, now)) {
    const start = weekStart(new Date(row.createdAt)).toISOString().slice(0, 10)
    if (counts.has(start)) counts.set(start, (counts.get(start) || 0) + 1)
  }
  return weeks.map((week) => ({ label: week.label, n: counts.get(week.start) || 0 }))
}

export function since(iso: string | null, now: Date, days: number): boolean {
  if (!iso) return false
  return now.getTime() - new Date(iso).getTime() <= days * 86_400_000
}

export type DoctorListRow = {
  id: string
  name: string
  where: string
  plan: string
  requests: number
  confirmed: number
  waiting: number
  reply: string
  health: number
  tone: HealthTone
  reasons: string[]
  views: number
  email: string | null
  phone: string | null
  userId: string | null
  slug: string | null
  founding: boolean
  verified: boolean
  timeline: string[]
}

export function doctorRows(roster: FounderRoster, now = new Date()): DoctorListRow[] {
  const people = new Map(roster.people.map((person) => [person.id, person]))
  const byDoctor = new Map<string, RequestRecord[]>()
  for (const row of openRequests(roster, now)) {
    if (!row.doctorId) continue
    const list = byDoctor.get(row.doctorId) || []
    list.push(row)
    byDoctor.set(row.doctorId, list)
  }
  return roster.doctors.map((doctor) => {
    const requests = byDoctor.get(doctor.id) || []
    const waiting = requests.filter((row) => waitingRequests({ ...roster, requests: [row] }, now).length > 0)
    const replied = requests.filter((row) => row.acknowledgedAt)
    const hours = replied.map((row) => hoursBetween(row.createdAt, row.acknowledgedAt || '')).filter((value): value is number => value != null)
    const person = doctor.userId ? people.get(doctor.userId) : undefined
    const health = doctorHealth({
      waiting48: waiting.length,
      requests: requests.length,
      replied: replied.length,
      lastSignIn: person?.lastSignIn || null,
      hasPhoto: doctor.photo,
      now,
    })
    const timeline = requests
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((row) => `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(new Date(row.createdAt))} · visit request`)
    if (doctor.createdAt) {
      timeline.push(`${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).format(new Date(doctor.createdAt))} · joined${doctor.founding ? ' (founding rate)' : ''}`)
    }
    return {
      id: doctor.id,
      name: doctor.name,
      where: [doctor.city, doctor.state].filter(Boolean).join(', ') || doctor.country,
      plan: doctor.founding ? 'Founding' : doctor.tier ? titleCase(doctor.tier) : 'Free listing',
      requests: requests.length,
      confirmed: requests.filter((row) => row.outcome === 'patient_contacted_confirmed').length,
      waiting: waiting.length,
      reply: formatHours(median(hours)),
      health: health.score,
      tone: health.tone,
      reasons: health.reasons,
      views: doctor.views,
      email: doctor.email,
      phone: doctor.phone,
      userId: doctor.userId,
      slug: doctor.slug,
      founding: doctor.founding,
      verified: doctor.verified,
      timeline,
    }
  }).sort((a, b) => a.health - b.health || b.waiting - a.waiting || a.name.localeCompare(b.name))
}

function titleCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function roiCard(roster: FounderRoster, now = new Date()) {
  const open = openRequests(roster, now)
  const confirmed = open.filter((row) => row.outcome === 'patient_contacted_confirmed').length
  const prices = roster.doctors.map((doctor) => parseVisitPrice(doctor.priceText)).filter((value): value is number => value != null)
  const visit = median(prices)
  const doctors = new Set(open.map((row) => row.doctorId).filter(Boolean)).size
  return {
    monthly: 99,
    visit,
    priceCount: prices.length,
    doctors,
    perDoctor: doctors ? Math.round((open.length / doctors) * 10) / 10 : null,
    sentValue: visit == null ? null : confirmed * visit,
    confirmed,
  }
}

export function memberRows(roster: FounderRoster): PersonRecord[] {
  return roster.people.filter((person) => person.role === 'patient')
}

export function studentRows(roster: FounderRoster): PersonRecord[] {
  return roster.people.filter((person) => person.role === 'student')
}

export type SearchHit = {
  label: string
  detail: string
  miles: number
  href: string
}

export function doctorsNear(roster: FounderRoster, lat: number, lng: number, limit = 5): SearchHit[] {
  return liveDoctors(roster)
    .map((doctor) => ({
      label: doctor.name,
      detail: [doctor.city, doctor.state].filter(Boolean).join(', '),
      miles: Math.round(haversineDistance(lat, lng, doctor.lat || 0, doctor.lng || 0) * 10) / 10,
      href: `/admin/people?id=${doctor.id}`,
    }))
    .sort((a, b) => a.miles - b.miles || a.label.localeCompare(b.label))
    .slice(0, limit)
}

export function demandNear(roster: FounderRoster, lat: number, lng: number, miles: number): number {
  return roster.points.filter((point) => haversineDistance(lat, lng, point.lat, point.lng) <= miles).length
}
