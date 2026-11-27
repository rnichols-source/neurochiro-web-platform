import { daysUntil, FOUNDING_END, median } from './format'
import { buildReach, openRequests, waitingRequests, type ReachCount } from './model'
import { doctorsToNudge, type NudgeStamp } from './nudge'
import type { FounderRoster } from './roster'

const DAY = 86_400_000
const ET = 'America/New_York'

export type Delta = { current: number; previous: number; diff: number }

export type WindowPair = { day: Delta; week: Delta }

export type PulseWindows = {
  mentions: WindowPair | null
  searches: WindowPair | null
  profileViews: WindowPair | null
  portalVisits: WindowPair | null
}

export type MorningNeed = {
  id: string
  title: string
  detail: string
  action: string
  href: string
  tone: 'alert' | 'people' | 'growth' | 'money'
  priority: number
  seeHref?: string
  seeLabel?: string
  nudge?: number
  nudgeSkipped?: number
}

export type PulseKpi = {
  id: string
  label: string
  value: string
  detail: string
  delta: string
  live: boolean
  tag: string
  href: string
  hrefLabel: string
  secondaryHref?: string
  secondaryLabel?: string
  wide?: boolean
}

export type WeekBar = { start: string; label: string; n: number; current: boolean }

export type PulseBilling = {
  stripeOk: boolean
  paying: number | null
  payingCustomers: number | null
  studentMemberships: number
  pastDue: number | null
  pastDueUsd: number | null
  mrrUsd: number | null
  disputesOpen: number | null
  disputeAmount: string | null
}

export function plainNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'Unavailable'
  return new Intl.NumberFormat('en-US').format(value)
}

export function plainMoney(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return 'Unavailable'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function deltaFromCounts(current: number, previous: number): Delta {
  return { current, previous, diff: current - previous }
}

/** Times strictly after `now - newerThanMs` and at or before `now - olderThanMs`. */
export function countCreated(times: (string | null | undefined)[], now: Date, newerThanMs: number, olderThanMs = 0): number {
  const start = now.getTime() - newerThanMs
  const end = now.getTime() - olderThanMs
  let count = 0
  for (const iso of times) {
    if (!iso) continue
    const time = new Date(iso).getTime()
    if (!Number.isFinite(time)) continue
    if (time > start && time <= end) count += 1
  }
  return count
}

export function compareCreated(times: (string | null | undefined)[], now: Date, windowMs: number): Delta {
  return deltaFromCounts(
    countCreated(times, now, windowMs, 0),
    countCreated(times, now, windowMs * 2, windowMs),
  )
}

export function describeDelta(diff: number, against: 'day' | 'week'): string {
  const base = against === 'day' ? 'the day before' : 'the week before'
  if (diff === 0) return `same as ${base}`
  const amount = Math.abs(diff).toLocaleString('en-US')
  return diff > 0 ? `${amount} more than ${base}` : `${amount} fewer than ${base}`
}

function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : pluralWord}`
}

export function zoneOffsetMinutes(instant: Date, timeZone = ET): number {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant).map((part) => [part.type, part.value]))
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  )
  return Math.round((asUtc - instant.getTime()) / 60000)
}

export function zonedYmd(instant: Date, timeZone = ET): { year: number; month: number; day: number } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant).map((part) => [part.type, part.value]))
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) }
}

function addCalendarDays(ymd: { year: number; month: number; day: number }, days: number) {
  const utc = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + days))
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() }
}

export function zonedMidnight(year: number, month: number, day: number, timeZone = ET): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const offset = zoneOffsetMinutes(guess, timeZone)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offset * 60000)
}

function weekdayIndex(instant: Date, timeZone = ET): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(instant)
  const index = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name)
  return index < 0 ? 0 : index
}

export function requestWeeks(roster: FounderRoster, now = new Date(), count = 8): WeekBar[] {
  const monday = addCalendarDays(zonedYmd(now), -weekdayIndex(now))
  const times = openRequests(roster, now).map((row) => new Date(row.createdAt).getTime())
  const weeks: WeekBar[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const startYmd = addCalendarDays(monday, -i * 7)
    const start = zonedMidnight(startYmd.year, startYmd.month, startYmd.day)
    const endYmd = addCalendarDays(startYmd, 7)
    const end = zonedMidnight(endYmd.year, endYmd.month, endYmd.day)
    let n = 0
    for (const time of times) {
      if (Number.isFinite(time) && time >= start.getTime() && time < end.getTime()) n += 1
    }
    weeks.push({
      start: start.toISOString(),
      label: `${startYmd.month}/${startYmd.day}`,
      n,
      current: i === 0,
    })
  }
  return weeks
}

export function morningLine(roster: FounderRoster, now: Date, windows: PulseWindows | null): string {
  const times = openRequests(roster, now).map((row) => row.createdAt)
  const day = compareCreated(times, now, DAY)
  const week = compareCreated(times, now, 7 * DAY)
  const portal = roster.communityVisits
  const portalWindows = windows?.portalVisits ?? null
  if (portal != null && portalWindows) {
    const dayCount = day.current + portalWindows.day.current
    const weekCount = week.current + portalWindows.week.current
    return `Since yesterday: ${plural(dayCount, 'new visit request')}, ${describeDelta(day.diff + portalWindows.day.diff, 'day')}. This week: ${plainNumber(weekCount)}, ${describeDelta(week.diff + portalWindows.week.diff, 'week')}.`
  }
  const directory = `Since yesterday: ${plural(day.current, 'new directory visit request')}, ${describeDelta(day.diff, 'day')}. This week: ${plainNumber(week.current)}, ${describeDelta(week.diff, 'week')}.`
  if (portal == null) return `${directory} Patient portal visits could not be compared, so they are not in these numbers.`
  if (portal === 0) return `Since yesterday: ${plural(day.current, 'new visit request')}, ${describeDelta(day.diff, 'day')}. This week: ${plainNumber(week.current)}, ${describeDelta(week.diff, 'week')}.`
  return `${directory} Patient portal visits since yesterday could not be compared.`
}

export function askingDelta(roster: FounderRoster, windows: PulseWindows | null): string {
  if (!roster.mentionsOk) return 'The count could not be loaded. This is not zero.'
  const week = windows?.mentions?.week
  if (!week) return 'This week could not be compared. The number above is all time, not zero.'
  return `${plainNumber(week.current)} this week, ${describeDelta(week.diff, 'week')}.`
}

export function visitKpi(roster: FounderRoster, now: Date, windows: PulseWindows | null): PulseKpi {
  const open = openRequests(roster, now)
  const day = compareCreated(open.map((row) => row.createdAt), now, DAY)
  const portal = roster.communityVisits
  const portalDay = windows?.portalVisits?.day
  let value = open.length
  let detail = `${plainNumber(open.length)} directory requests, spam left out.`
  let delta = `${plainNumber(day.current)} since yesterday, ${describeDelta(day.diff, 'day')}.`
  if (portal == null) {
    detail += ' Patient portal visits could not be counted, so they are not in this total.'
  } else {
    value += portal
    detail = `${plainNumber(open.length)} directory requests, spam left out. ${plainNumber(portal)} from the patient portal.`
    if (portal > 0 && portalDay) delta = `${plainNumber(day.current + portalDay.current)} since yesterday, ${describeDelta(day.diff + portalDay.diff, 'day')}.`
    else if (portal > 0) delta += ' Patient portal visits since yesterday could not be compared.'
  }
  return {
    id: 'visits',
    label: 'Visit requests',
    value: plainNumber(value),
    detail,
    delta,
    live: true,
    tag: 'Live data',
    href: '/admin/leads?tab=requests',
    hrefLabel: 'Open visit requests',
  }
}

export function askingKpi(roster: FounderRoster, windows: PulseWindows | null): PulseKpi {
  return {
    id: 'asking',
    label: 'People asking',
    value: roster.mentionsOk ? plainNumber(roster.demandCount) : 'Unavailable',
    detail: 'Instagram comments and coverage searches. Not site visitors.',
    delta: askingDelta(roster, windows),
    live: roster.mentionsOk,
    tag: roster.mentionsOk ? 'Live data' : 'Unavailable',
    href: '/admin/growth',
    hrefLabel: 'Open the demand map',
  }
}

export function doctorsKpi(roster: FounderRoster, now: Date): PulseKpi {
  const live = roster.doctors.filter((doctor) => doctor.verified)
  const hidden = roster.doctors.filter((doctor) => doctor.listing === 'hidden').length
  const pending = roster.doctors.filter((doctor) => doctor.listing === 'pending').length
  const unverified = roster.doctors.filter((doctor) => doctor.listing === 'unverified').length
  const week = compareCreated(live.map((doctor) => doctor.createdAt), now, 7 * DAY)
  return {
    id: 'doctors',
    label: 'Doctors live',
    value: plainNumber(live.length),
    detail: `${plainNumber(hidden)} hidden, ${plainNumber(pending)} pending, ${plainNumber(unverified)} not verified.`,
    delta: `${plainNumber(week.current)} created this week and live now, ${describeDelta(week.diff, 'week')}. Counted by the day the record was created.`,
    live: true,
    tag: 'Live data',
    href: '/admin/people?filter=live',
    hrefLabel: 'See live doctors',
    wide: true,
  }
}

export function moneyKpis(billing: PulseBilling, unpaid: number, paidKnown: boolean): PulseKpi[] {
  const payingLive = billing.stripeOk && billing.paying != null
  const mrrLive = billing.stripeOk && billing.mrrUsd != null
  const student = billing.studentMemberships
    ? ` ${plainNumber(billing.studentMemberships)} student memberships included.`
    : ''
  const past = billing.pastDue == null || billing.pastDueUsd == null
    ? 'Past due could not be read.'
    : `${plural(billing.pastDue, 'membership')} past due (${plainMoney(billing.pastDueUsd)}), not in this total.`
  return [
    {
      id: 'paying',
      label: 'Paying memberships',
      value: payingLive ? plainNumber(billing.paying) : 'Unavailable',
      detail: payingLive
        ? `${plainNumber(billing.payingCustomers)} customers.${student} A change from yesterday is not stored.`
        : 'Stripe did not answer. This is not zero.',
      delta: paidKnown ? `${plainNumber(unpaid)} live without a paid plan.` : 'Could not check who has no paid plan.',
      live: payingLive,
      tag: payingLive ? 'Live from Stripe' : 'Unavailable',
      href: '/admin/money',
      hrefLabel: 'Open Money',
      secondaryHref: paidKnown ? '/admin/people?filter=unpaid' : undefined,
      secondaryLabel: paidKnown ? 'See who has no paid plan' : undefined,
    },
    {
      id: 'mrr',
      label: 'MRR',
      value: mrrLive ? plainMoney(billing.mrrUsd) : 'Unavailable',
      detail: mrrLive ? `${plainNumber(billing.paying)} paying memberships. ${past}` : 'Stripe did not answer. This is not zero.',
      delta: 'No saved total from yesterday, so this is the current total only.',
      live: mrrLive,
      tag: mrrLive ? 'Live from Stripe' : 'Unavailable',
      href: '/admin/money',
      hrefLabel: 'Open Money',
    },
  ]
}

export function moneyAlerts(billing: PulseBilling): { title: string; detail: string; href: string }[] {
  if (!billing.stripeOk) return []
  const alerts: { title: string; detail: string; href: string }[] = []
  if (billing.pastDue) {
    alerts.push({
      title: `${plural(billing.pastDue, 'membership')} past due`,
      detail: `${plainMoney(billing.pastDueUsd)} is not in MRR. Pulse does not charge anyone.`,
      href: '/admin/money',
    })
  }
  if (billing.disputesOpen) {
    alerts.push({
      title: `${plural(billing.disputesOpen, 'open card dispute')}`,
      detail: billing.disputeAmount ? `${billing.disputeAmount} on Stripe. Pulse does not respond to it.` : 'Open Money to see it. Pulse does not respond to it.',
      href: '/admin/money',
    })
  }
  return alerts
}

export function morningNeeds(input: {
  roster: FounderRoster
  now?: Date
  instagram: number | null
  profileFailed: number | null
  recentNudges?: NudgeStamp[] | null
}): MorningNeed[] {
  const now = input.now ?? new Date()
  const roster = input.roster
  const needs: MorningNeed[] = []
  const waiting = waitingRequests(roster, now)
  if (waiting.length) {
    const doctors = new Set(waiting.map((row) => row.doctorId).filter(Boolean))
    const unassigned = waiting.filter((row) => !row.doctorId).length
    const ids = [...doctors] as string[]
    const known = input.recentNudges === undefined ? [] : input.recentNudges
    let nudge: number | undefined
    let nudgeSkipped = 0
    let action = doctors.size ? `Nudge all ${doctors.size}` : 'See requests'
    let extra = ''
    if (doctors.size && known == null) {
      action = 'See who'
      extra = ' Could not check who was nudged in the last 20 hours. Nudge all stays off until that check works. This is not zero skipped.'
    } else if (doctors.size && known) {
      const plan = doctorsToNudge(ids, known, now)
      nudgeSkipped = plan.skipped.length
      if (plan.send.length) {
        nudge = plan.send.length
        action = `Nudge all ${plan.send.length}`
        if (plan.skipped.length) {
          const skip = plan.skipped.length === 1
            ? '1 was nudged in the last 20 hours and will be skipped.'
            : `${plan.skipped.length} were nudged in the last 20 hours and will be skipped.`
          extra = ` ${plan.send.length} will get a reminder. ${skip}`
        }
      } else {
        action = 'See who'
        extra = plan.skipped.length === 1
          ? ' This doctor was nudged in the last 20 hours, so Nudge all will not send.'
          : ` All ${plan.skipped.length} were nudged in the last 20 hours, so Nudge all will not send.`
      }
    }
    const detail = (unassigned
      ? `${plural(doctors.size, 'doctor')} can be reminded. ${plural(unassigned, 'request')} ${unassigned === 1 ? 'has' : 'have'} no doctor, so ${unassigned === 1 ? 'it is' : 'they are'} not in the nudge.`
      : `At ${plural(doctors.size, 'doctor')}. See who is quiet, or send a reminder.`) + extra
    needs.push({
      id: 'waiting',
      title: `${plural(waiting.length, 'visit request')} waiting 48h+`,
      detail,
      action,
      href: doctors.size ? '/admin/people?filter=ignoring' : '/admin/leads?tab=requests',
      tone: 'alert',
      priority: 10,
      nudge,
      nudgeSkipped,
    })
  }
  const review = roster.applications.filter((row) => row.status === 'under_review')
  if (review.length) {
    needs.push({
      id: 'applications',
      title: `${plural(review.length, 'application')} waiting on a decision`,
      detail: 'Approve and charge, or decline. Each one asks you to confirm who and the price.',
      action: 'Review',
      href: '/admin/applications',
      tone: 'people',
      priority: 20,
    })
  }
  if (input.instagram == null) {
    needs.push({
      id: 'instagram',
      title: 'Instagram DMs could not be counted',
      detail: 'This is not zero. Open the queue to see who is waiting. Nothing is sent from the site.',
      action: 'Open Instagram DMs',
      href: '/admin/instagram',
      tone: 'people',
      priority: 30,
    })
  } else if (input.instagram > 0) {
    needs.push({
      id: 'instagram',
      title: `${plural(input.instagram, 'Instagram DM')} waiting for you to send`,
      detail: 'Nothing is sent from the site. You copy each one and send it in Instagram.',
      action: 'Open Instagram DMs',
      href: '/admin/instagram',
      tone: 'people',
      priority: 30,
    })
  }
  if (input.profileFailed == null) {
    needs.push({
      id: 'profiles',
      title: 'Profile research could not be loaded',
      detail: 'This is not zero. Open the list to see if an approved doctor is stuck.',
      action: 'Open profile research',
      href: '/admin/profile-builds',
      tone: 'people',
      priority: 40,
    })
  } else if (input.profileFailed > 0) {
    needs.push({
      id: 'profiles',
      title: `${plural(input.profileFailed, 'profile')} stopped after 3 tries`,
      detail: 'These approved doctors still need a look.',
      action: 'Review failures',
      href: '/admin/profile-builds',
      tone: 'people',
      priority: 40,
    })
  }
  const days = daysUntil(now, FOUNDING_END)
  if (days > 0) {
    const founding = roster.doctors.filter((doctor) => doctor.founding && doctor.verified).length
    needs.push({
      id: 'founding',
      title: `Founding rate ends Dec 1, ${plural(days, 'day')}`,
      detail: `${plural(founding, 'live founding doctor')}. The email is not sent until you confirm the count. Hidden and unverified doctors are left out.`,
      action: 'Draft email',
      href: '/admin/broadcast?audience=founding&draft=founding',
      tone: 'money',
      priority: days <= 7 ? 55 : 80,
      seeHref: '/admin/people?filter=founding',
      seeLabel: 'See who',
    })
  }
  const drafts = roster.applications.filter((row) => row.status === 'draft')
  if (drafts.length) {
    needs.push({
      id: 'drafts',
      title: `${plural(drafts.length, 'doctor')} started and did not pay`,
      detail: roster.remindersKnown
        ? 'Open the drafts and check the last reminder before you send another.'
        : 'Could not check whether a reminder already went out. Look before you send another.',
      action: 'Review drafts',
      href: '/admin/applications?queue=progress',
      tone: 'people',
      priority: 70,
      seeHref: '/admin/broadcast?audience=stalled&draft=stalled',
      seeLabel: 'Draft a reminder',
    })
  }
  if (roster.gapAsks || roster.unmeasured) {
    const names = roster.gaps.slice(0, 3).map((gap) => gap.city).filter(Boolean).join(', ')
    needs.push({
      id: 'gaps',
      title: `${plainNumber(roster.gapAsks)} asks confirmed 50+ miles from a doctor, ${plainNumber(roster.unmeasured)} not measured yet`,
      detail: names || 'Distance is missing on the ones not measured yet.',
      action: 'See targets',
      href: '/admin/growth#targets',
      tone: 'growth',
      priority: 90,
    })
  }
  return needs.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
}

export function replyMedianLabel(roster: FounderRoster, now = new Date()): string {
  const hours = openRequests(roster, now)
    .map((row) => {
      if (!row.acknowledgedAt) return null
      const start = new Date(row.createdAt).getTime()
      const end = new Date(row.acknowledgedAt).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
      return (end - start) / 3_600_000
    })
    .filter((value): value is number => value != null)
  const value = median(hours)
  if (value == null) return 'No reply time is saved yet, so there is no median.'
  const label = value < 36 ? `${Math.max(1, Math.round(value))} hours` : `${Math.max(1, Math.round(value / 24))} days`
  return `Median time for a doctor to reply: ${label}. Counted on directory requests that have a reply time.`
}

export function weekNote(roster: FounderRoster): string {
  if (roster.communityVisits == null) return 'Bars are directory requests only. Patient portal visits could not be added. Weeks start Monday, Eastern time. The lighter bar is this week, still in progress.'
  if (roster.communityVisits === 0) return 'Bars are directory requests. The patient portal has 0. Weeks start Monday, Eastern time. The lighter bar is this week, still in progress.'
  return 'Bars are directory requests. Patient portal visits are in the total above, not in these bars. Weeks start Monday, Eastern time. The lighter bar is this week, still in progress.'
}

export function reachLines(roster: FounderRoster, windows: PulseWindows | null): ReachCount[] {
  const [searches, views, asks] = buildReach(roster)
  return [
    { ...searches, detail: withWeek(searches.detail, windows?.searches?.week ?? null) },
    { ...views, detail: withWeek(views.detail, windows?.profileViews?.week ?? null) },
    { ...asks, detail: withWeek(asks.detail, windows?.mentions?.week ?? null) },
  ]
}

function withWeek(detail: string, week: Delta | null): string {
  if (!week) return `${detail} This week could not be compared.`
  return `${detail} ${plainNumber(week.current)} this week, ${describeDelta(week.diff, 'week')}.`
}

export function whoCounts(roster: FounderRoster): { value: string; label: string }[] {
  const live = roster.doctors.filter((doctor) => doctor.verified).length
  const notLive = roster.doctors.length - live
  const patients = roster.people.filter((person) => person.role === 'patient').length
  const students = roster.people.filter((person) => person.role === 'student').length
  const confirmed = roster.subscribers.filter((row) => row.confirmed).length
  return [
    { value: plainNumber(live), label: `live doctors, ${plainNumber(notLive)} not live` },
    { value: plainNumber(patients), label: 'patient accounts' },
    { value: plainNumber(confirmed), label: 'confirmed email subscribers' },
    { value: plainNumber(students), label: 'students' },
  ]
}

export function listingViewLabel(roster: FounderRoster): string {
  const total = roster.doctors.reduce((sum, doctor) => sum + (doctor.views || 0), 0)
  return `Doctor listing counters add up to ${plainNumber(total)}. That is a different tracker from the site view above.`
}

export const DASH = /[\u2013\u2014]/
