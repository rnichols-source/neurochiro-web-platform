import Link from 'next/link'
import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { AdminRouteSkeleton } from '@/components/loading/route-skeletons'
import { Card, Tag, ToolLinks } from '@/components/founder/bits'
import { daysUntil, formatMoney, formatNumber, FOUNDING_END } from '@/lib/founder/format'
import { loadDoctorBilling } from '@/lib/founder/money'
import { MONEY_TOOLS } from '@/lib/founder/places'
import { loadFounderRoster } from '@/lib/founder/roster'
import { requireAdminPage } from '@/lib/founder/guard'

export const dynamic = 'force-dynamic'

export default async function MoneyPage() {
  await requireAdminPage()
  return (
    <div>
      <PlaceHeader place="money" title="Money" subtitle="What comes in, what’s at risk, and what changes on Dec 1." />
      <Suspense fallback={<AdminRouteSkeleton />}>
        <MoneyBody />
      </Suspense>
    </div>
  )
}

async function MoneyBody() {
  const now = new Date()
  const [roster, billing] = await Promise.all([loadFounderRoster(), loadDoctorBilling()])
  const founding = roster.doctors.filter((doctor) => doctor.founding)
  const live = roster.doctors.filter((doctor) => doctor.verified).length
  const days = daysUntil(now, FOUNDING_END)
  const maxPlan = Math.max(1, ...billing.plans.map((plan) => plan.n))

  return (
      <div className="space-y-4 px-4 py-4 lg:px-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Tile label="MRR" value={billing.mrrUsd == null ? '—' : formatMoney(billing.mrrUsd)} detail={billing.stripeOk ? 'Doctor memberships only' : 'Stripe unavailable'} kind={billing.mrrUsd == null ? 'tracking' : 'live'} />
          <Tile label="Paying doctors" value={billing.paying == null ? '—' : formatNumber(billing.paying)} detail={`of ${formatNumber(live)} live · same memberships as MRR`} kind="live" />
          <Tile label="Founding members" value={formatNumber(founding.length)} detail="rate locked" kind="live" />
          <Tile label="Past due memberships" value={billing.pastDue == null ? '—' : formatNumber(billing.pastDue)} detail="Doctor memberships past due or unpaid" kind={billing.pastDue == null ? 'tracking' : 'live'} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-[#FBF1DC] lg:col-span-1">
            <div id="heads-up" className="flex gap-4">
              <div className="grid min-w-[120px] place-items-center rounded-2xl bg-[#B7791F] px-3 py-4 text-center text-white">
                <span className="fd-ui text-[11px] font-extrabold uppercase">Founding rate ends</span>
                <b className="fd-ui text-[40px] leading-none">Dec 1</b>
                <span className="fd-ui font-extrabold">{days} days</span>
              </div>
              <div>
                <h2 className="fd-ui text-[20px] font-extrabold">{formatNumber(founding.length)} founding members</h2>
                <p className="mt-1 text-[14px] text-[#4a5865]">Who keeps the locked rate, and who hears about Dec 1 first.</p>
                <Link href="/admin/broadcast?audience=founding" className="fd-ui mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#B7791F] px-3 text-[13px] font-extrabold text-white">Draft the heads-up</Link>
                <Link href="/admin/people?tab=doctors" className="ml-2 inline-flex min-h-11 items-center text-[13px] font-bold text-[#8A5A0F]">See the list</Link>
              </div>
            </div>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Failed payments</h2><Tag kind={billing.pastDue == null ? 'tracking' : 'live'}>{billing.pastDue == null ? 'Unavailable' : 'Live data'}</Tag></div>
            <b className="fd-ui text-[40px]">{billing.pastDue == null ? '—' : formatNumber(billing.pastDue)}</b>
            <p className="text-[13px] text-[#5b6773]">doctor memberships past due or unpaid</p>
            <Link href="/admin/revenue" className="mt-2 inline-flex min-h-11 items-center font-bold text-[#8A5A0F]">Open revenue detail</Link>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Plans on doctor memberships</h2><Tag kind={billing.stripeOk ? 'live' : 'tracking'}>{billing.stripeOk ? 'Live data' : 'Unavailable'}</Tag></div>
            {billing.plans.length === 0 ? <p className="text-[14px] text-[#5b6773]">{billing.stripeOk ? 'No doctor memberships came back.' : 'Stripe did not answer.'}</p> : billing.plans.map((plan) => (
              <div key={plan.label} className="mb-2 grid grid-cols-[1fr_80px_24px] items-center gap-2 text-[13px]">
                <span>{plan.label}</span>
                <span className="h-3 overflow-hidden rounded-full bg-[#F3F1EC]"><span className="block h-full bg-[#B7791F]" style={{ width: `${(plan.n / maxPlan) * 100}%` }} /></span>
                <b>{plan.n}</b>
              </div>
            ))}
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Churn · last 30 days</h2><Tag kind={billing.churn30 == null ? 'tracking' : 'live'}>{billing.churn30 == null ? 'Unavailable' : 'Live data'}</Tag></div>
            <b className="fd-ui text-[40px]">{billing.churn30 == null ? '—' : formatNumber(billing.churn30)}</b>
            <p className="text-[13px] text-[#5b6773]">canceled doctor memberships</p>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Refunds & disputes</h2><Tag kind={billing.refunds30 == null ? 'tracking' : 'estimate'}>{billing.refunds30 == null ? 'Unavailable' : 'Whole Stripe account'}</Tag></div>
            <b className="fd-ui text-[40px]">{billing.refunds30 == null ? '—' : formatNumber(billing.refunds30)}</b>
            <p className="text-[13px] text-[#5b6773]">refunds in 30 days on the whole Stripe account · {billing.disputesOpen == null ? 'disputes unavailable' : `${billing.disputesOpen} open disputes${billing.disputeAmount ? ` · ${billing.disputeAmount}` : ''}`}</p>
          </Card>
        </div>
        <ToolLinks links={MONEY_TOOLS} />
      </div>
  )
}

function Tile({ label, value, detail, kind }: { label: string; value: string; detail: string; kind: 'live' | 'tracking' }) {
  return (
    <div className="rounded-[18px] border-t-[5px] border-[#B7791F] bg-white p-4">
      <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#B7791F]">{label}</p>
      <p className="fd-ui text-[32px] font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[13px] text-[#5b6773]">{detail}</p>
      <Tag kind={kind === 'live' ? 'live' : 'tracking'}>{kind === 'live' ? 'Live data' : 'Unavailable'}</Tag>
    </div>
  )
}
