import Link from 'next/link'
import { PlaceHeader } from '@/components/founder/header'
import { Card, Tag, ToolLinks } from '@/components/founder/bits'
import { daysUntil, formatMoney, formatNumber, FOUNDING_END } from '@/lib/founder/format'
import { loadMoneyExtras, loadToday } from '@/lib/founder/money'
import { MONEY_TOOLS } from '@/lib/founder/places'
import { loadFounderRoster } from '@/lib/founder/roster'

export const dynamic = 'force-dynamic'

export default async function MoneyPage() {
  const now = new Date()
  const [roster, today, extras] = await Promise.all([
    loadFounderRoster(),
    loadToday().catch(() => null),
    loadMoneyExtras(),
  ])
  const founding = roster.doctors.filter((doctor) => doctor.founding)
  const live = roster.doctors.filter((doctor) => doctor.verified).length
  const days = daysUntil(now, FOUNDING_END)
  const maxPlan = Math.max(1, ...extras.plans.map((plan) => plan.n))

  return (
    <div>
      <PlaceHeader place="money" title="Money" subtitle="What comes in, what’s at risk, and what changes on Dec 1." />
      <div className="space-y-4 px-4 py-4 lg:px-8">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Tile label="MRR" value={today?.mrrUsd == null ? '—' : formatMoney(today.mrrUsd)} detail={today?.stripeOk ? 'Active Stripe subscriptions' : 'Stripe unavailable'} kind={today?.mrrUsd == null ? 'tracking' : 'live'} />
          <Tile label="Paying doctors" value={today?.paying == null ? '—' : formatNumber(today.paying)} detail={`of ${formatNumber(live)} live`} kind="live" />
          <Tile label="Founding members" value={formatNumber(founding.length)} detail="rate locked" kind="live" />
          <Tile label="Failed invoices · 30 days" value={today?.failedInvoices30d == null ? '—' : formatNumber(today.failedInvoices30d)} detail={today?.failedSubscriptions == null ? 'Stripe' : `${today.failedSubscriptions} subscriptions past due or unpaid`} kind={today ? 'live' : 'tracking'} />
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
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Failed payments</h2><Tag kind={today?.failedSubscriptions == null ? 'tracking' : 'live'}>{today?.failedSubscriptions == null ? 'Unavailable' : 'Live data'}</Tag></div>
            <b className="fd-ui text-[40px]">{today?.failedSubscriptions == null ? '—' : formatNumber(today.failedSubscriptions)}</b>
            <p className="text-[13px] text-[#5b6773]">subscriptions past due or unpaid</p>
            <Link href="/admin/revenue" className="mt-2 inline-flex min-h-11 items-center font-bold text-[#8A5A0F]">Open revenue detail</Link>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Plans on active subscriptions</h2><Tag kind={extras.stripeOk ? 'live' : 'tracking'}>{extras.stripeOk ? 'Live data' : 'Unavailable'}</Tag></div>
            {extras.plans.length === 0 ? <p className="text-[14px] text-[#5b6773]">{extras.stripeOk ? 'No active subscriptions came back.' : 'Stripe did not answer.'}</p> : extras.plans.map((plan) => (
              <div key={plan.label} className="mb-2 grid grid-cols-[1fr_80px_24px] items-center gap-2 text-[13px]">
                <span>{plan.label}</span>
                <span className="h-3 overflow-hidden rounded-full bg-[#F3F1EC]"><span className="block h-full bg-[#B7791F]" style={{ width: `${(plan.n / maxPlan) * 100}%` }} /></span>
                <b>{plan.n}</b>
              </div>
            ))}
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Churn · last 30 days</h2><Tag kind={extras.churn30 == null ? 'tracking' : 'live'}>{extras.churn30 == null ? 'Unavailable' : 'Live data'}</Tag></div>
            <b className="fd-ui text-[40px]">{extras.churn30 == null ? '—' : formatNumber(extras.churn30)}</b>
            <p className="text-[13px] text-[#5b6773]">canceled Stripe subscriptions</p>
          </Card>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="fd-ui font-extrabold">Refunds & disputes</h2><Tag kind={extras.refunds30 == null ? 'tracking' : 'live'}>{extras.refunds30 == null ? 'Unavailable' : 'Live data'}</Tag></div>
            <b className="fd-ui text-[40px]">{extras.refunds30 == null ? '—' : formatNumber(extras.refunds30)}</b>
            <p className="text-[13px] text-[#5b6773]">refunds in 30 days · {extras.disputesOpen == null ? 'disputes unavailable' : `${extras.disputesOpen} open disputes${extras.disputeAmount ? ` · ${extras.disputeAmount}` : ''}`}</p>
          </Card>
        </div>
        <ToolLinks links={MONEY_TOOLS} />
      </div>
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
