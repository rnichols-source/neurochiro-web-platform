import { waitingRequests } from './model'
import type { FounderRoster } from './roster'

export const AUDIENCES = [
  'doctors',
  'members',
  'students',
  'subscribers',
  'everyone',
  'founding',
  'ignoring',
  'stalled',
  'unconfirmed',
] as const

export type AudienceKey = (typeof AUDIENCES)[number]
export type Channel = 'banner' | 'email' | 'inapp' | 'text'

export type Recipient = {
  key: string
  name: string
  email: string | null
  userId: string | null
  phone: string | null
  textOk: boolean
}

export type AudienceFilters = {
  state?: string
  country?: string
}

export function isAudience(value: string): value is AudienceKey {
  return (AUDIENCES as readonly string[]).includes(value)
}

function doctorRecipient(doctor: FounderRoster['doctors'][number]): Recipient {
  return {
    key: `doctor:${doctor.id}`,
    name: doctor.name,
    email: doctor.email,
    userId: doctor.userId,
    phone: doctor.sms ? doctor.phone : null,
    textOk: doctor.sms && Boolean(doctor.phone),
  }
}

function personRecipient(person: FounderRoster['people'][number], prefix: string): Recipient {
  return {
    key: `${prefix}:${person.id}`,
    name: person.name,
    email: person.email,
    userId: person.id,
    phone: null,
    textOk: false,
  }
}

export function resolveAudience(roster: FounderRoster, key: AudienceKey, filters: AudienceFilters = {}, now = new Date()): Recipient[] {
  const state = (filters.state || '').trim().toUpperCase()
  const country = (filters.country || '').trim().toUpperCase()
  const doctors = roster.doctors.filter((doctor) => {
    if (state && doctor.state.toUpperCase() !== state) return false
    if (country && doctor.country.toUpperCase() !== country) return false
    return true
  })
  const waitingDoctors = new Set(waitingRequests(roster, now).map((row) => row.doctorId).filter(Boolean))
  let rows: Recipient[] = []
  if (key === 'doctors' || key === 'everyone') rows.push(...doctors.map(doctorRecipient))
  if (key === 'founding') rows.push(...doctors.filter((doctor) => doctor.founding).map(doctorRecipient))
  if (key === 'ignoring') rows.push(...doctors.filter((doctor) => waitingDoctors.has(doctor.id)).map(doctorRecipient))
  if (key === 'members' || key === 'everyone') rows.push(...roster.people.filter((person) => person.role === 'patient').map((person) => personRecipient(person, 'member')))
  if (key === 'students' || key === 'everyone') rows.push(...roster.people.filter((person) => person.role === 'student').map((person) => personRecipient(person, 'student')))
  if (key === 'subscribers' || key === 'everyone') {
    rows.push(...roster.subscribers.filter((row) => row.confirmed).map((row) => ({
      key: `sub:${row.id}`,
      name: row.email,
      email: row.email,
      userId: null,
      phone: row.sms ? row.smsPhone : null,
      textOk: row.sms,
    })))
  }
  if (key === 'unconfirmed') {
    rows = roster.subscribers.filter((row) => !row.confirmed && row.status !== 'unsubscribed').map((row) => ({
      key: `sub:${row.id}`,
      name: row.email,
      email: row.email,
      userId: null,
      phone: null,
      textOk: false,
    }))
  }
  if (key === 'stalled') {
    const people = new Map(roster.people.map((person) => [person.id, person]))
    rows = roster.applications.filter((row) => row.status === 'draft' && row.userId && people.get(row.userId)).map((row) => personRecipient(people.get(row.userId!)!, 'draft'))
  }
  const seen = new Set<string>()
  return rows.filter((row) => {
    const id = row.email?.toLowerCase() || row.userId || row.key
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function reachable(recipients: Recipient[], channels: Channel[]): Recipient[] {
  if (channels.length === 1 && channels[0] === 'banner') return recipients
  return recipients.filter((row) => channels.some((channel) => canReceive(row, channel)))
}

export function canReceive(row: Recipient, channel: Channel): boolean {
  if (channel === 'banner') return true
  if (channel === 'email') return Boolean(row.email)
  if (channel === 'inapp') return Boolean(row.userId)
  return row.textOk && Boolean(row.phone)
}
