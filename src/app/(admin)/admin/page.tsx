import Link from 'next/link'
import { redirect } from 'next/navigation'
import { adminToday } from '@/lib/admin/metrics'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { KpiTile } from '@/components/admin/ui/KpiTile'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { TodayRefresh } from './today-refresh'

export const dynamic = 'force-dynamic'

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function countText(value: number | null) {
  return value === null ? 'Unavailable' : String(value)
}

export default async function TodayPage() {
  let today
  try {
    today = await adminToday()
  } catch {
    redirect('/login?next=/admin')
  }
  const foundingComped = today.founding + today.comped
  const mrrDetail = today.mrrOther.length
    ? today.mrrOther.map((row) => money(row.amount, row.currency)).join(' · ')
    : null
  const needs = [
    today.pendingApprovals ? { href: '/admin/moderation', label: `${today.pendingApprovals} doctors waiting for approval` } : null,
    today.invisibleDoctors ? { href: '/admin/invisible-doctors', label: `${today.invisibleDoctors} doctors with no usable pin` } : null,
    today.failedSubscriptions ? { href: '/admin/revenue', label: `${today.failedSubscriptions} subscriptions past due or unpaid` } : null,
    today.patientRequestsWaiting ? { href: '/admin/leads?tab=requests', label: `${today.patientRequestsWaiting} patient requests need a look` } : null,
    today.leadsWaitingOnDoctors ? { href: '/admin/leads?tab=requests', label: `${today.leadsWaitingOnDoctors} leads still waiting on a doctor` } : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item))

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <PageHeader
        title="Today"
        description="Most numbers refresh every 10 minutes. Patient requests match the Leads badge on this visit. Refresh reads the rest again."
        action={<TodayRefresh />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiTile
          href="/admin/directory"
          label="Paying members"
          value={countText(today.paying)}
          detail={today.membersOk ? `${foundingComped} founding/comped${today.trialing === null ? '' : ` · ${today.trialing} trialing`}` : null}
          caption="Paying is a doctor profile with an active Stripe subscription. Founding and comped come from the membership record and are not also counted as paying."
        />
        <KpiTile
          href="/admin/revenue"
          label="MRR"
          value={today.mrrUsd === null ? 'Unavailable' : money(today.mrrUsd, 'USD')}
          detail={mrrDetail}
          caption="Sum of active Stripe subscriptions. Quantity, billing interval, and a current coupon are included. Other currencies stay in their own total."
        />
        <KpiTile
          href="/admin/directory"
          label="New signups"
          value={countText(today.newDoctors7d)}
          detail={today.waitlistConfirmed === null ? null : `${today.waitlistConfirmed} waitlist confirmed · ${today.waitlistNew7d ?? 0} new this week`}
          caption="New doctor profiles in the last 7 days. Waitlist subscribers are a separate count."
        />
        <KpiTile
          href="/admin/leads?tab=requests"
          label="Patient requests waiting"
          value={countText(today.patientRequestsWaiting)}
          caption="Same rule as the Leads badge: flagged by an admin, a failed send, no doctor recipient, a missed will-call, or still open after 2 hours."
        />
        <KpiTile
          href="/admin/leads?tab=requests"
          label="Leads waiting on doctors"
          value={countText(today.leadsWaitingOnDoctors)}
          caption={`Sent to a doctor and still not acknowledged after ${today.escalationHours} hours.`}
        />
        <KpiTile
          href="/admin/revenue"
          label="Failed payments"
          value={countText(today.failedSubscriptions)}
          detail={today.failedInvoices30d === null ? null : `${today.failedInvoices30d} failed invoices in 30 days`}
          caption="Subscriptions in past due or unpaid, plus invoices that failed in the last 30 days."
        />
      </div>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-neuro-navy">Needs you</h2>
        {needs.length === 0 ? (
          <EmptyState title="Nothing in this list is waiting." body="Pending approvals, missing pins, failed payments, and waiting leads show up here." />
        ) : (
          <ul className="space-y-2">
            {needs.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex min-h-11 items-center rounded-xl bg-white px-4 text-sm text-neuro-navy shadow-sm">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-neuro-navy">Recent activity</h2>
        {today.activity.length === 0 ? (
          <EmptyState title="No audit log rows." />
        ) : (
          <ul className="divide-y divide-black/5 rounded-2xl bg-white">
            {today.activity.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-neuro-navy">{item.event}</p>
                <p className="text-neuro-gray">{item.user}{item.target ? ` · ${item.target}` : ''} · {item.category}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
