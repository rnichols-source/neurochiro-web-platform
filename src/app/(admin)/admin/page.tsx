import Link from 'next/link'
import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { Card, FunnelList, Tag, ToolLinks } from '@/components/founder/bits'
import { NudgeButton } from '@/components/founder/nudge-button'
import { greeting, firstName } from '@/lib/portal/greeting'
import { loadAdminActor } from '@/lib/admin-auth'
import { requireAdminPage } from '@/lib/founder/guard'
import { etStamp, formatMoney, formatNumber, median } from '@/lib/founder/format'
import { buildFunnel, buildNeeds, openRequests, since, waitingRequests, weekSeries } from '@/lib/founder/model'
import { loadDoctorBilling } from '@/lib/founder/money'
import { loadFounderRoster } from '@/lib/founder/roster'
import { PEOPLE_TOOLS } from '@/lib/founder/places'

export const dynamic = 'force-dynamic'

export default async function PulsePage() {
  const now = new Date()
  await requireAdminPage()
  const actor = await loadAdminActor()
  const short = firstName(actor?.name)
  const helloName = short === 'Raymond' ? 'Ray' : short
  const nowIso = now.toISOString()
  return (
    <div>
      <PlaceHeader place="pulse" eyebrow={etStamp(now)} title={`${greeting(now, 'America/New_York')}, ${helloName}`}>
        <Suspense fallback={<KpiSkeleton />}>
          <PulseKpis nowIso={nowIso} />
        </Suspense>
      </PlaceHeader>
      <Suspense fallback={<BodySkeleton />}>
        <PulseBody nowIso={nowIso} />
      </Suspense>
    </div>
  )
}

async function PulseKpis({ nowIso }: { nowIso: string }) {
  const now = new Date(nowIso)
  const roster = await loadFounderRoster()
  const open = openRequests(roster, now)
  const live = roster.doctors.filter((doctor) => doctor.verified).length
  const newDoctors = roster.doctors.filter((doctor) => since(doctor.createdAt, now, 30)).length
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi label="Demand" value={roster.mentionsOk ? formatNumber(roster.demandCount) : '—'} detail={`${roster.cities.toLocaleString('en-US')} cities · ${roster.countryCount} countries`} />
      <Kpi label="Visit requests" value={formatNumber(open.length + (roster.communityVisits || 0))} detail={`${open.filter((row) => since(row.createdAt, now, 30)).length} in the last 30 days`} />
      <Kpi label="Doctors live" value={formatNumber(live)} detail={`${formatNumber(roster.doctors.length)} listed · ${formatNumber(newDoctors)} new in 30 days`} />
      <Suspense fallback={<div className="h-28 animate-pulse rounded-[18px] bg-white/80" aria-hidden="true" />}>
        <PayingKpi />
      </Suspense>
      <Suspense fallback={<div className="h-28 animate-pulse rounded-[18px] bg-white/80" aria-hidden="true" />}>
        <MrrKpi />
      </Suspense>
    </div>
  )
}

async function PayingKpi() {
  const billing = await loadDoctorBilling()
  return <Kpi label="Paying doctors" value={billing.paying == null ? '—' : formatNumber(billing.paying)} detail="Doctor memberships only" />
}

async function MrrKpi() {
  const billing = await loadDoctorBilling()
  return <Kpi label="MRR" value={billing.mrrUsd == null ? '—' : formatMoney(billing.mrrUsd)} detail={billing.stripeOk ? 'Doctor memberships only · $99, $990, CA$139, $199' : 'Stripe unavailable'} />
}

async function PulseBody({ nowIso }: { nowIso: string }) {
  const now = new Date(nowIso)
  const roster = await loadFounderRoster()
  const open = openRequests(roster, now)
  const repliedHours = open
    .map((row) => row.acknowledgedAt ? (new Date(row.acknowledgedAt).getTime() - new Date(row.createdAt).getTime()) / 3_600_000 : null)
    .filter((value): value is number => value != null && value >= 0)
  const newDoctors = roster.doctors.filter((doctor) => since(doctor.createdAt, now, 30)).length
  const members = roster.people.filter((person) => person.role === 'patient').length
  const students = roster.people.filter((person) => person.role === 'student').length
  const confirmedSubs = roster.subscribers.filter((row) => row.confirmed).length
  const needs = buildNeeds(roster, now)
  const weeks = weekSeries(roster, now)
  const maxWeek = Math.max(1, ...weeks.map((week) => week.n))
  const waitingDoctorCount = new Set(waitingRequests(roster, now).map((row) => row.doctorId).filter(Boolean)).size

  return (
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-2 lg:px-8">
        <div className="space-y-4">
          <Card>
            <h2 className="fd-ui mb-2 text-[17px] font-extrabold text-[#D66829]">Needs you today · {needs.length}</h2>
            {needs.length === 0 ? <p className="text-[14px] text-[#5b6773]">Nothing in this list is waiting.</p> : needs.map((need) => (
              <div key={need.id} className="flex items-center gap-3 border-t border-[#EFECE7] py-3 first:border-0">
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
          <Card>
            <div className="mb-3 flex items-center justify-between"><h2 className="fd-ui text-[17px] font-extrabold">Who’s on NeuroChiro</h2><Tag kind="live">Live data</Tag></div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Mix value={formatNumber(roster.doctors.length)} label="doctors listed" tint="#DCF1EE" />
              <Mix value={formatNumber(members)} label="community member accounts" tint="#FCEBDF" />
              <Mix value={formatNumber(confirmedSubs)} label="email subscribers" tint="#E2ECF8" />
              <Mix value={formatNumber(students)} label="students" tint="#EFE5F5" />
            </div>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between"><h2 className="fd-ui text-[17px] font-extrabold">Last 30 days</h2><Tag kind="live">Live data</Tag></div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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
              <h2 className="fd-ui text-[17px] font-extrabold">Requests → visits</h2>
              <span className="text-[12px] text-[#8a95a1]">all time</span>
            </div>
            <FunnelList steps={buildFunnel(roster, now)} />
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
          <ToolLinks links={PEOPLE_TOOLS.slice(0, 4)} />
        </div>
      </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-[18px] bg-white/80" />
      ))}
    </div>
  )
}

function BodySkeleton() {
  return (
    <div className="grid gap-4 px-4 py-4 lg:grid-cols-2 lg:px-8" aria-hidden="true">
      <div className="h-64 animate-pulse rounded-[22px] bg-white" />
      <div className="h-64 animate-pulse rounded-[22px] bg-white" />
    </div>
  )
}

function Kpi({ label, value, detail, estimate = false }: { label: string; value: string; detail: string; estimate?: boolean }) {
  return (
    <div className="rounded-[18px] border-t-[5px] border-[#D66829] bg-white px-4 py-3 text-[#15202B]">
      <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#D66829]">{label}</p>
      <p className="fd-ui text-[32px] font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[13px] text-[#5b6773]">{detail}</p>
      {estimate ? <Tag kind="estimate">Estimate</Tag> : <Tag kind="live">Live data</Tag>}
    </div>
  )
}

function Mix({ value, label, tint }: { value: string; label: string; tint: string }) {
  return <div className="rounded-2xl p-3" style={{ background: tint }}><b className="fd-ui block text-[26px]">{value}</b><span className="text-[12px] text-[#3d4a57]">{label}</span></div>
}

function formatHoursShort(hours: number | null): string {
  if (hours == null) return '—'
  if (hours < 36) return `${Math.max(1, Math.round(hours))} h`
  return `${Math.round(hours / 24)} d`
}
