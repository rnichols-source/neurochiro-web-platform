import { Suspense } from 'react';
import PageHeader from '@/components/portal/PageHeader';
import StatusPill from '@/components/portal/StatusPill';
import { getBillingData, invalidateCurrentDoctorStripe } from './actions';
import { ActivateProButtons, ManageBillingButton } from './BillingButtons';
import { getPortalContext } from '@/lib/portal/context';
import { PRO_PRICE_LABEL, type Membership } from '@/lib/portal/membership';
import { billingPlan } from '@/lib/portal/billing-view';
import { redirect } from 'next/navigation';
import { portalTimer } from '@/lib/portal/timing';

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const [ctx, params] = await Promise.all([getPortalContext(), searchParams]);
  if (!ctx) redirect('/login');
  if (params.billing === 'refresh') await invalidateCurrentDoctorStripe();
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingLoaded membership={ctx.membership} />
    </Suspense>
  );
}

async function BillingLoaded({ membership }: { membership: Membership }) {
  const done = portalTimer('billing');
  const billing = await getBillingData();
  done();
  const plan = billingPlan(membership, billing);
  const view = plan.view;
  const description =
    view === 'included' || view === 'included_with_stripe'
      ? membership.isFounder
        ? 'Your plan: Founding member. Pro is included.'
        : view === 'included'
          ? 'Your plan: Pro is on this account. There is no card on file yet.'
          : 'Your plan: Pro is on this account at no charge.'
      : view === 'stripe'
        ? `Your plan: ${plan.planName}${plan.priceLabel ? `, ${plan.priceLabel}` : ''}.${plan.dateLabel ? ` ${plan.dateLabel}.` : ''}`
        : view === 'error'
          ? "We couldn't load your billing details right now."
          : 'Your plan: Free. Activate Pro when you want community members to reach you.';
  const showStripe = view === 'stripe' || view === 'included_with_stripe';

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description={description} />
      {view === 'error' ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <p className="text-sm text-portal-ink">We couldn&apos;t load your billing details right now. Try again in a minute.</p>
          <p className="mt-2 text-sm text-portal-ink-2">
            Questions about your plan? <a className="font-bold text-portal-accent" href="mailto:support@neurochirodirectory.com">support@neurochirodirectory.com</a>
          </p>
        </section>
      ) : null}
      {view === 'included' ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-portal-ink">{membership.isFounder ? 'Founding member: Pro is included. There is nothing to pay and no card on file.' : 'Pro is on this account. There is no card on file yet.'}</h2>
          <p className="mt-2 text-sm text-portal-ink-2">
            {membership.isFounder
              ? 'Card updates and receipts appear here after a Stripe customer is on the account.'
              : 'Update card and receipts appear here after Stripe has a customer for this login. Activate Pro below if you still need to pay.'}
          </p>
          {membership.isFounder ? null : <div className="mt-4"><ActivateProButtons /></div>}
        </section>
      ) : null}
      {showStripe && billing && !('error' in billing) && !billing.noCustomer ? (
        <section className="bg-white border border-portal-border rounded-xl p-6 space-y-3">
          {view === 'included_with_stripe' ? (
            <p className="text-sm text-portal-ink-2">
              {membership.isFounder
                ? 'Founding member: Pro is included. Card charges below are for extras such as seminar hosting.'
                : 'Pro is on this account at no charge. Card charges below are for extras such as seminar hosting.'}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-portal-ink">{plan.planName}</h2>
            {plan.statusLabel ? <StatusPill label={plan.statusLabel} tone={plan.statusTone} /> : null}
          </div>
          <p className="text-2xl font-bold text-portal-ink">{plan.priceLabel || 'Pro included'}</p>
          {billing.subscription?.paymentMethod && view === 'stripe' ? <p className="text-sm text-portal-ink-2">Card ending {billing.subscription.paymentMethod}</p> : null}
          {plan.dateLabel ? <p className="text-sm text-portal-ink-2">{plan.dateLabel}</p> : null}
          <ManageBillingButton />
        </section>
      ) : null}
      {view === 'free' ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-portal-ink">Activate Pro</h2>
          <p className="mt-1 text-sm text-portal-ink-2">{PRO_PRICE_LABEL} or $990/year. Cancel anytime.</p>
          <div className="mt-4"><ActivateProButtons /></div>
        </section>
      ) : null}
      {billing && 'invoices' in billing && billing.invoices?.length ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-portal-ink mb-3">Invoices</h2>
          <ul className="divide-y divide-portal-border">
            {billing.invoices.map((invoice) => (
              <li key={invoice.id}>
                <a href={invoice.url || '#'} target="_blank" rel="noopener noreferrer" className="min-h-11 flex items-center justify-between gap-3 text-sm text-portal-ink">
                  <span>{invoice.date} · {invoice.status}</span>
                  <span className="font-bold">${invoice.amount.toFixed(2)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-portal-surface" />
      <div className="h-36 animate-pulse rounded-xl border border-portal-border bg-white" />
    </div>
  );
}
