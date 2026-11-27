import { haversineDistance } from '@/lib/geo'
import { doctorHealth, type HealthTone } from './health-score'
import { daysUntil, formatHours, FOUNDING_END, lastWeeks, median, parseVisitPrice, weekStart } from './format'
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
  tag?: string
  href?: string
}

export type ReachCount = {
  label: string
  detail: string
  value: string
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
  return roster.requests.filter((row) => {
    if (row.status === 'withdrawn' || row.status === 'spam') return false
    if (!row.createdAt) return false
    return new Date(row.createdAt).getTime() <= now.getTime()
  })
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

function countOrMissing(value: number | null, ok = true): string {
  if (!ok || value == null) return 'Unavailable'
  return value.toLocaleString('en-US')
}

export function buildReach(roster: FounderRoster): ReachCount[] {
  return [
    {
      label: 'Searched the directory',
      detail: 'Site searches. People who opened a profile from Google or Instagram are not in this count.',
      value: countOrMissing(roster.searches),
    },
    {
      label: 'Viewed a doctor',
      detail: 'Profile views recorded on the site. Each listing also keeps its own view counter. Those add up separately.',
      value: countOrMissing(roster.profileViews),
    },
    {
      label: 'Asked for a doctor',
      detail: 'Instagram comments and coverage searches. This is not a count of site visitors.',
      value: countOrMissing(roster.demandCount, roster.mentionsOk),
    },
  ]
}

export function listingViewTotal(roster: FounderRoster): number {
  return roster.doctors.reduce((sum, doctor) => sum + (doctor.views || 0), 0)
}

function linearPercent(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0
  return Math.max(4, Math.min(100, Math.round((value / max) * 100)))
}

function portalLine(count: number | null): string {
  if (count == null) return 'Patient portal visits could not be counted, so they are not in this number.'
  if (count === 0) return '0 from the patient portal.'
  if (count === 1) return '1 patient portal visit is tracked separately and is not in this number.'
  return `${count.toLocaleString('en-US')} patient portal visits are tracked separately and are not in this number.`
}

/** Directory requests only. `officeOn` null means the switch could not be read. */
export function buildRequestFunnel(roster: FounderRoster, now = new Date(), officeOn: boolean | null = false): FunnelStep[] {
  const open = openRequests(roster, now)
  const directory = open.length
  const replied = open.filter((row) => row.acknowledgedAt).length
  const confirmedRows = open.filter((row) => row.outcome === 'patient_contacted_confirmed')
  const confirmed = confirmedRows.length
  const confirmedWithoutReply = confirmedRows.filter((row) => !row.acknowledgedAt).length
  const share = (count: number) => directory ? `${Math.round((count / directory) * 100)}% of directory requests` : 'No directory requests yet'
  const doctorCount = new Set(open.map((row) => row.doctorId).filter(Boolean)).size
  const confirmedDetail = confirmedWithoutReply
    ? `${share(confirmed)}. ${confirmedWithoutReply.toLocaleString('en-US')} marked confirmed with no reply time saved, so this step can be larger than Doctor replied.`
    : share(confirmed)
  const steps: FunnelStep[] = [
    {
      label: 'Requested a visit',
      detail: `Directory requests, all time, spam left out. ${doctorCount.toLocaleString('en-US')} doctors. ${portalLine(roster.communityVisits)}`,
      value: String(directory),
      width: directory ? 100 : 0,
      tone: 'pulse',
      tracking: false,
    },
    {
      label: 'Doctor replied',
      detail: share(replied),
      value: String(replied),
      width: linearPercent(replied, directory),
      tone: 'pulse',
      tracking: false,
    },
    {
      label: 'Contact confirmed',
      detail: confirmedDetail,
      value: String(confirmed),
      width: linearPercent(confirmed, directory),
      tone: 'pulse',
      tracking: false,
    },
  ]
  steps.push(officeVisitStep(roster, directory, officeOn))
  return steps
}

function officeVisitStep(roster: FounderRoster, requested: number, officeOn: boolean | null): FunnelStep {
  if (officeOn == null) {
    return {
      label: 'Went into the office',
      detail: 'Settings could not be loaded, so this is not off and it is not zero.',
      value: 'Unavailable',
      width: 0,
      tone: 'pulse',
      tracking: true,
      tag: 'Unavailable',
    }
  }
  if (!officeOn) {
    return {
      label: 'Went into the office',
      detail: 'Off. Turn on in Settings.',
      value: 'Off',
      width: 0,
      tone: 'pulse',
      tracking: true,
      tag: 'Off',
      href: '/admin/settings',
    }
  }
  if (!roster.office.ready) {
    return {
      label: 'Went into the office',
      detail: 'The switch is on. The office-visit columns are not in the database yet.',
      value: 'Not ready',
      width: 0,
      tone: 'pulse',
      tracking: true,
      tag: 'On',
    }
  }
  if (roster.office.sent === 0 && roster.office.yes === 0) {
    return {
      label: 'Went into the office',
      detail: 'On. No one has been asked yet.',
      value: '0',
      width: 0,
      tone: 'pulse',
      tracking: false,
      tag: 'On',
    }
  }
  return {
    label: 'Went into the office',
    detail: `${roster.office.yes} yes, ${roster.office.no} no, ${roster.office.sent} asked`,
    value: String(roster.office.yes),
    width: linearPercent(roster.office.yes, Math.max(requested, 1)),
    tone: 'pulse',
    tracking: false,
    tag: 'On',
  }
}

/** @deprecated Use buildReach and buildRequestFunnel. Kept so older imports still compile. */
export function buildFunnel(roster: FounderRoster, now = new Date(), officeOn = false): FunnelStep[] {
  return buildRequestFunnel(roster, now, officeOn)
}

export function buildNeeds(roster: FounderRoster, now = new Date()): NeedItem[] {
  const waiting = waitingRequests(roster, now)
  const doctors = new Set(waiting.map((row) => row.doctorId).filter(Boolean))
  const review = roster.applications.filter((row) => row.status === 'under_review')
  const drafts = roster.applications.filter((row) => row.status === 'draft')
  const days = daysUntil(now, FOUNDING_END)
  const founding = roster.doctors.filter((doctor) => doctor.founding && doctor.verified).length
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
  if (review.length) {
    needs.push({
      id: 'applications',
      title: `${review.length} application${review.length === 1 ? '' : 's'} waiting on a decision`,
      detail: 'Approve and charge, or decline. Each one asks you to confirm.',
      action: 'Review',
      href: '/admin/applications',
      tone: 'people',
    })
  }
  if (drafts.length) {
    needs.push({
      id: 'drafts',
      title: `${drafts.length} doctor${drafts.length === 1 ? '' : 's'} started but didn't pay`,
      detail: 'A scheduled note may already have gone out. Check the last reminder before you send another.',
      action: 'Send a reminder',
      href: '/admin/broadcast?audience=stalled',
      tone: 'people',
    })
  }
  if (roster.gapAsks || roster.unmeasured) {
    const names = roster.gaps.slice(0, 3).map((gap) => gap.city).join(', ')
    needs.push({
      id: 'gaps',
      title: `${roster.gapAsks.toLocaleString('en-US')} confirmed far · ${roster.unmeasured.toLocaleString('en-US')} not measured yet`,
      detail: names || 'Distance is missing on the ones not measured yet.',
      action: 'See targets',
      href: '/admin/growth#targets',
      tone: 'growth',
    })
  }
  if (days > 0) {
    needs.push({
      id: 'founding',
      title: `Founding rate ends Dec 1 · ${days} day${days === 1 ? '' : 's'}`,
      detail: `${founding} live founding doctors. The email list leaves out hidden and unverified doctors.`,
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
  listing: DoctorRecord['listing']
  paid: boolean
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
      listing: doctor.listing,
      paid: doctor.paid,
      timeline,
    }
  }).sort((a, b) => a.health - b.health || b.waiting - a.waiting || a.name.localeCompare(b.name))
}

function titleCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function roiCard(roster: FounderRoster, now = new Date(), carePlansStarted: number | null = null, averageCarePlan: number | null = null) {
  const open = openRequests(roster, now)
  const confirmed = open.filter((row) => row.outcome === 'patient_contacted_confirmed').length
  const prices = roster.doctors.map((doctor) => parseVisitPrice(doctor.priceText)).filter((value): value is number => value != null)
  const visit = median(prices)
  const doctors = new Set(open.map((row) => row.doctorId).filter(Boolean)).size
  const plans = carePlansStarted == null || averageCarePlan == null ? null : carePlansStarted * averageCarePlan
  return {
    monthly: 99,
    visit,
    priceCount: prices.length,
    doctors,
    perDoctor: doctors ? Math.round((open.length / doctors) * 10) / 10 : null,
    sentValue: visit == null ? null : confirmed * visit,
    confirmed,
    carePlansStarted,
    averageCarePlan,
    carePlanValue: plans,
    carePlanVisitValue: visit == null || carePlansStarted == null ? null : carePlansStarted * visit,
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
