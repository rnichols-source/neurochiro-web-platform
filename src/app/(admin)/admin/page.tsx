import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { CouldNotLoad } from '@/components/founder/load-error'
import { KpiCard, MoneyAlerts, MorningBanner, NeedsCard, OtherCounts, RequestPath, WeekChart, WhoHere } from '@/components/founder/pulse-view'
import { greeting, firstName } from '@/lib/portal/greeting'
import { loadAdminActor } from '@/lib/admin-auth'
import { requireAdminPage } from '@/lib/founder/guard'
import { etStamp } from '@/lib/founder/format'
import { buildRequestFunnel } from '@/lib/founder/model'
import { loadDoctorBilling } from '@/lib/founder/money'
import {
  askingKpi,
  doctorsKpi,
  listingViewLabel,
  moneyAlerts,
  moneyKpis,
  morningLine,
  morningNeeds,
  reachLines,
  replyMedianLabel,
  requestWeeks,
  visitKpi,
  weekNote,
  whoCounts,
  type PulseBilling,
} from '@/lib/founder/pulse'
import { loadPulseWindows } from '@/lib/founder/pulse-windows'
import { loadFounderRoster } from '@/lib/founder/roster'
import { loadRecentNudges } from '@/lib/founder/send'
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
    <div className="overflow-x-hidden">
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

function profileCount(board: { ready: boolean; failed: { id: string }[]; loadError?: boolean } | null): number | null {
  if (!board || board.loadError) return null
  if (!board.ready) return 0
  return board.failed.length
}

async function PulseMain({ nowIso }: { nowIso: string }) {
  const now = new Date(nowIso)
  const rosterPromise = loadFounderRoster()
  const settingsPromise = loadFounderSettings()
  const buildsPromise = loadProfileBuildBoard().catch(() => null)
  const dmsPromise = waitingInstagramDms()
  const windowsPromise = loadPulseWindows().catch(() => null)
  const nudgesPromise = loadRecentNudges().catch(() => null)
  let roster
  let settings
  try {
    ;[roster, settings] = await Promise.all([rosterPromise, settingsPromise])
  } catch {
    return <CouldNotLoad what="Pulse" />
  }
  const [builds, dms, windows, recentNudges] = await Promise.all([buildsPromise, dmsPromise, windowsPromise, nudgesPromise])
  const officeOn = settings.error ? null : settings.automations.didYouGetIn
  const needs = morningNeeds({ roster, now, instagram: dms, profileFailed: profileCount(builds), recentNudges })
  const kpis = [askingKpi(roster, windows), visitKpi(roster, now, windows), doctorsKpi(roster, now)]
  const live = roster.doctors.filter((doctor) => doctor.verified)
  const unpaid = live.filter((doctor) => !doctor.paid).length

  return (
    <div className="space-y-4 overflow-x-hidden px-4 py-4 lg:px-8">
      <MorningBanner line={morningLine(roster, now, windows)} />
      <NeedsCard needs={needs} instagramClear={dms === 0} />
      <Suspense fallback={null}>
        <MoneyAlertRow />
      </Suspense>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
        <Suspense fallback={<MoneySkeleton />}>
          <MoneyCards unpaid={unpaid} paidKnown={roster.paidKnown} />
        </Suspense>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RequestPath
          steps={buildRequestFunnel(roster, now, officeOn)}
          median={replyMedianLabel(roster, now)}
        />
        <div className="space-y-4">
          <WeekChart weeks={requestWeeks(roster, now)} note={weekNote(roster)} />
          <WhoHere rows={whoCounts(roster)} />
        </div>
      </div>
      <OtherCounts counts={reachLines(roster, windows)} listingNote={listingViewLabel(roster)} />
    </div>
  )
}

function billingSlice(billing: Awaited<ReturnType<typeof loadDoctorBilling>>): PulseBilling {
  const student = billing.segments.find((segment) => segment.key === 'student')?.subscriptions || 0
  return {
    stripeOk: billing.stripeOk,
    paying: billing.paying,
    payingCustomers: billing.payingCustomers,
    studentMemberships: student,
    pastDue: billing.pastDue,
    pastDueUsd: billing.pastDueUsd,
    mrrUsd: billing.mrrUsd,
    disputesOpen: billing.disputesOpen,
    disputeAmount: billing.disputeAmount,
  }
}

async function MoneyAlertRow() {
  const billing = await loadDoctorBilling()
  return <MoneyAlerts alerts={moneyAlerts(billingSlice(billing))} />
}

async function MoneyCards({ unpaid, paidKnown }: { unpaid: number; paidKnown: boolean }) {
  const billing = await loadDoctorBilling()
  const cards = moneyKpis(billingSlice(billing), unpaid, paidKnown)
  return (
    <>
      {cards.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
    </>
  )
}

function BodySkeleton() {
  return (
    <div className="space-y-4 px-4 py-4 lg:px-8" aria-hidden="true">
      <div className="h-16 animate-pulse rounded-[18px] bg-white" />
      <div className="h-40 animate-pulse rounded-[22px] bg-white" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[18px] bg-white" />
        ))}
      </div>
    </div>
  )
}

function MoneySkeleton() {
  return (
    <>
      <div className="h-36 animate-pulse rounded-[18px] bg-white" />
      <div className="h-36 animate-pulse rounded-[18px] bg-white" />
    </>
  )
}
