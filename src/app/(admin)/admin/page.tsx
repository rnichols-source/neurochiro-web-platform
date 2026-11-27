import Link from 'next/link'
import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { Card, FunnelList, ReachCounts, Tag, ToolLinks } from '@/components/founder/bits'
import { CouldNotLoad } from '@/components/founder/load-error'
import { NudgeButton } from '@/components/founder/nudge-button'
import { greeting, firstName } from '@/lib/portal/greeting'
import { loadAdminActor } from '@/lib/admin-auth'
import { requireAdminPage } from '@/lib/founder/guard'
import { etStamp, formatNumber, median } from '@/lib/founder/format'
import { buildReach, buildRequestFunnel, buildNeeds, listingViewTotal, openRequests, since, waitingRequests, weekSeries } from '@/lib/founder/model'
import { loadDoctorBilling } from '@/lib/founder/money'
import { loadFounderRoster } from '@/lib/founder/roster'
import { PEOPLE_TOOLS } from '@/lib/founder/places'
import { loadFounderSettings } from '@/lib/founder/settings'
import { createAdminClient } from '@/lib/supabase-admin'
import { loadProfileBuildBoard } from '@/lib/profile-build/board'

export const dynamic = 'force-dynamic'

export default async function PulsePage() {
  const now = new Date()
  await requireAdminPage()
  const actor = await loadAdminActor()
  const short = firstName(actor?.name)
  const helloName = short === 'Raymond' ? 'Ray' : short
  return (
    <div>
      <PlaceHeader place="pulse" eyebrow={etStamp(now)} title={`${greeting(now, 'America/New_York')}, ${helloName}`} />
      <Suspense fallback={<BodySkeleton />}>
        <PulseMain nowIso={now.toISOString()} />
      </Suspense>
    </div>
  )
}

async function waitingInstagramDms(): Promise<number | null> {
  try {
    const admin = createAdminClient() as unknown as {
      from: (table: string) => {
        select: (columns: string, options: { count: 'exact'; head: true }) => {
          is: (column: string, value: null) => Promise<{ count: number | null; error: { message?: string } | null }>
        }
      }
    }
    const { count, error } = await admin.from('ig_dm_items').select('id', { count: 'exact', head: true }).is('sent_at', null)
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

async function PulseMain({ nowIso }: { nowIso: string }) {
  const now = new Date(nowIso)
  let roster
  let settings
  try {
    ;[roster, settings] = await Promise.all([loadFounderRoster(), loadFounderSettings()])
  } catch {
    return <CouldNotLoad what="Pulse" />
  }
  const [builds, dms] = await Promise.all([
    loadProfileBuildBoard().then((board) => board).catch(() => null),
    waitingInstagramDms(),
  ])
  const open = openRequests(roster, now)
  const repliedHours = open
    .map((row) => row.acknowledgedAt ? (new Date(row.acknowledgedAt).getTime() - new Date(row.createdAt).getTime()) / 3_600_000 : null)
    .filter((value): value is number => value != null && value >= 0)
  const live = roster.doctors.filter((doctor) => doctor.verified)
  const notLive = roster.doctors.length - live.length
  const unpaid = live.filter((doctor) => !doctor.paid).length
  const newDoctors = roster.doctors.filter((doctor) => since(doctor.createdAt, now, 30)).length
  const members = roster.people.filter((person) => person.role === 'patient').length
  const students = roster.people.filter((person) => person.role === 'student').length
  const confirmedSubs = roster.subscribers.filter((row) => row.confirmed).length
  const needs = buildNeeds(roster, now)
  const weeks = weekSeries(roster, now)
  const maxWeek = Math.max(1, ...weeks.map((week) => week.n))
  const waitingDoctorCount = new Set(waitingRequests(roster, now).map((row) => row.doctorId).filter(Boolean)).size
  const visitTotal = open.length + (roster.communityVisits || 0)
  const officeOn = !settings.error && settings.automations.didYouGetIn

  return (
    <div className="space-y-4 px-4 py-4 lg:px-8">
      <Card>
        <h2 className="fd-ui mb-2 text-[17px] font-extrabold text-[#D66829]">Needs you today · {needs.length}</h2>
        {needs.length === 0 ? <p className="text-[14px] text-[#5b6773]">Nothing in this list is waiting.</p> : needs.map((need) => (
          <div key={need.id} className="flex flex-wrap items-center gap-3 border-t border-[#EFECE7] py-3 first:border-0">
            <div className="min-w-0 flex-1">
              <p className="fd-ui text-[15px] font-extrabold">{need.title}</p>
              <p className="text-[13px] text-[#5b6773]">{need.detail}</p>
            </div>
            {need.id === 'waiting' ? <NudgeButton count={waitingDoctorCount} /> : (
              <Link href={need.href} className="fd-ui inline-flex min-h-10 items-center rounded-xl px-3 text-[13px] font-extrabold text-white" style={{ background: need.tone === 'people' ? '#0E857A' : need.tone === 'growth' ? '#2C6BB4' : '#B7791F' }}>{need.action}</Link>
            )}
          </div>
        ))}
      </Card>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Kpi label="People asking" value={roster.mentionsOk ? formatNumber(roster.demandCount) : 'Unavailable'} detail="Instagram comments and coverage searches" live={roster.mentionsOk} />
        <Kpi label="Visit requests" value={formatNumber(visitTotal)} detail={`all time · ${formatNumber(open.filter((row) => since(row.createdAt, now, 30)).length)} in the last 30 days`} />
        <Kpi label="Doctors live" value={formatNumber(live.length)} detail={`${formatNumber(notLive)} hidden or pending · ${formatNumber(newDoctors)} new in 30 days`} />
        <Suspense fallback={<div className="h-28 animate-pulse rounded-[18px] bg-white/80" aria-hidden="true" />}>
          <PayingKpi unpaid={unpaid} paidKnown={roster.paidKnown} />
        </Suspense>
        <Suspense fallback={<div className="h-28 animate-pulse rounded-[18px] bg-white/80" aria-hidden="true" />}>
          <MrrKpi />
        </Suspense>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <h2 className="fd-ui text-[17px] font-extrabold">Instagram DMs</h2>
            <p className="mt-1 text-[13px] text-[#5b6773]">
              {dms == null ? 'The queue could not be counted.' : `${formatNumber(dms)} waiting for you to send.`} When you approve a doctor, nearby Instagram requests wait here. Nothing is sent until you send it.
            </p>
            <Link href="/admin/instagram" className="fd-ui mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#15202B] px-3 text-[13px] font-extrabold text-white">Open Instagram DMs</Link>
          </Card>
          {builds == null ? (
            <Card>
              <h2 className="fd-ui text-[17px] font-extrabold">Profile research</h2>
              <p className="mt-1 text-[13px] text-[#5b6773]">Could not load this list. It is not zero.</p>
            </Card>
          ) : builds.failed.length > 0 ? (
            <Card>
              <h2 className="fd-ui text-[17px] font-extrabold text-[#D66829]">Profile research · {builds.failed.length}</h2>
              <p className="mt-1 text-[13px] text-[#5b6773]">These approved doctors still need a look. Research stopped after 3 tries.</p>
              <Link href="/admin/profile-builds" className="fd-ui mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-3 text-[13px] font-extrabold text-white">Review failures</Link>
            </Card>
          ) : null}
          <Card>
            <div className="mb-3 flex items-center justify-between"><h2 className="fd-ui text-[17px] font-extrabold">Who&apos;s on NeuroChiro</h2><Tag kind="live">Live data</Tag></div>
            <div className="grid grid-cols-2 gap-2">
              <Mix value={formatNumber(live.length)} label={`live · ${formatNumber(notLive)} hidden or pending`} tint="#DCF1EE" />
              <Mix value={formatNumber(members)} label="patient accounts" tint="#FCEBDF" />
              <Mix value={formatNumber(confirmedSubs)} label="email subscribers" tint="#E2ECF8" />
              <Mix value={formatNumber(students)} label="students" tint="#EFE5F5" />
            </div>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between"><h2 className="fd-ui text-[17px] font-extrabold">Last 30 days</h2><Tag kind="live">Live data</Tag></div>
            <div className="grid grid-cols-2 gap-2">
              <Mix value={`+${newDoctors}`} label="new doctors" tint="#DCF1EE" />
              <Mix value={formatNumber(open.filter((row) => since(row.createdAt, now, 30)).length)} label="visit requests" tint="#FCEBDF" />
              <Mix value={formatNumber(open.filter((row) => since(row.createdAt, now, 7)).length)} label="requests in the last 7 days" tint="#E2ECF8" />
              <Mix value={formatHoursShort(median(repliedHours))} label="median doctor reply" tint="#FBF1DC" />
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="fd-ui text-[17px] font-extrabold">Reach</h2>
              <span className="text-[12px] text-[#8a95a1]">separate counts, not a funnel</span>
            </div>
            <ReachCounts counts={buildReach(roster)} />
            <p className="mt-3 text-[12px] text-[#6b7785]">Doctor listing counters add up to {formatNumber(listingViewTotal(roster))}. That is a different tracker from the site view above.</p>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="fd-ui text-[17px] font-extrabold">Request funnel</h2>
              <span className="text-[12px] text-[#8a95a1]">all time</span>
            </div>
            {settings.error ? <p className="mb-2 text-[13px] text-[#B4501A]">Settings could not be loaded, so the office-visit switch is not shown as on or off.</p> : null}
            <FunnelList steps={buildRequestFunnel(roster, now, officeOn)} />
            <Link href="/admin/growth/funnel" className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold text-[#B4501A]">Open the full funnel</Link>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between"><h2 className="fd-ui text-[17px] font-extrabold">Visit requests per week</h2><Tag kind="live">Live data</Tag></div>
            <div className="flex h-24 items-end gap-2">
              {weeks.map((week) => (
                <div key={week.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-md bg-[#D66829]" style={{ height: `${Math.max(6, (week.n / maxWeek) * 80)}px`, opacity: week.label.endsWith('*') ? 0.55 : 1 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#8a95a1]">
              {weeks.map((week) => <span key={week.label}>{week.label}</span>)}
            </div>
            <Link href="/admin/card" className="mt-4 inline-flex min-h-11 items-center text-[13px] font-bold text-[#D66829]">Open the phone stats card</Link>
          </Card>
          <ToolLinks links={PEOPLE_TOOLS} />
        </div>
      </div>
    </div>
  )
}

async function PayingKpi({ unpaid, paidKnown }: { unpaid: number; paidKnown: boolean }) {
  const billing = await loadDoctorBilling()
  const student = billing.segments.find((segment) => segment.key === 'student')?.subscriptions || 0
  const stripeDetail = billing.stripeOk
    ? `${formatNumber(billing.payingCustomers)} customers${student ? ` · ${student} student membership included` : ''}`
    : 'Stripe unavailable'
  const gap = paidKnown
    ? `${formatNumber(unpaid)} live without a paid plan`
    : 'Could not check who has no paid plan'
  return (
    <Kpi
      label="Paying memberships"
      value={billing.paying == null ? 'Unavailable' : formatNumber(billing.paying)}
      detail={`${stripeDetail}. ${gap}.`}
      live={billing.stripeOk}
      href={paidKnown ? '/admin/people?filter=unpaid' : undefined}
      hrefLabel={paidKnown ? 'See who has no paid plan' : undefined}
    />
  )
}

async function MrrKpi() {
  const billing = await loadDoctorBilling()
  const paying = billing.paying == null ? 'Unavailable' : formatNumber(billing.paying)
  const past = billing.pastDueUsd == null ? 'Unavailable' : formatMoneySafe(billing.pastDueUsd)
  return (
    <Kpi
      label="MRR"
      value={billing.mrrUsd == null ? 'Unavailable' : formatMoneySafe(billing.mrrUsd)}
      detail={billing.stripeOk ? `${paying} paying memberships · ${past} past due` : 'Stripe unavailable'}
      tag={billing.stripeOk ? 'Live from Stripe' : 'Unavailable'}
      live={billing.stripeOk}
    />
  )
}

function BodySkeleton() {
  return (
    <div className="space-y-4 px-4 py-4 lg:px-8" aria-hidden="true">
      <div className="h-40 animate-pulse rounded-[22px] bg-white" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[18px] bg-white" />
        ))}
      </div>
    </div>
  )
}

function Kpi({ label, value, detail, tag, live = true, href, hrefLabel }: { label: string; value: string; detail: string; tag?: string; live?: boolean; href?: string; hrefLabel?: string }) {
  const kind = live ? 'live' : 'tracking'
  const text = tag || (live ? 'Live data' : 'Unavailable')
  return (
    <div className="rounded-[18px] border-t-[5px] border-[#D66829] bg-white px-4 py-3 text-[#15202B]">
      <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#D66829]">{label}</p>
      <p className="fd-ui text-[28px] font-extrabold leading-none sm:text-[32px]">{value}</p>
      <p className="mt-1 text-[13px] text-[#5b6773]">{detail}</p>
      {href && hrefLabel ? <Link href={href} className="mt-1 inline-flex min-h-10 items-center text-[13px] font-bold text-[#B4501A]">{hrefLabel}</Link> : null}
      <Tag kind={kind}>{text}</Tag>
    </div>
  )
}

function Mix({ value, label, tint }: { value: string; label: string; tint: string }) {
  return <div className="rounded-2xl p-3" style={{ background: tint }}><b className="fd-ui block text-[26px]">{value}</b><span className="text-[12px] text-[#3d4a57]">{label}</span></div>
}

function formatHoursShort(hours: number | null): string {
  if (hours == null) return 'Unavailable'
  if (hours < 36) return `${Math.max(1, Math.round(hours))} h`
  return `${Math.round(hours / 24)} d`
}

function formatMoneySafe(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}
