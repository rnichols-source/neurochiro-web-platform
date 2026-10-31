import PageHeader from '@/components/portal/PageHeader';
import StatusPill from '@/components/portal/StatusPill';
import { getBillingData } from './actions';
import { ActivateProButtons, ManageBillingButton } from './BillingButtons';
import { getPortalContext } from '@/lib/portal/context';
import { PRO_PRICE_LABEL } from '@/lib/portal/membership';
import { billingView } from '@/lib/portal/billing-view';
import { redirect } from 'next/navigation';
import { portalTimer } from '@/lib/portal/timing';

export default async function BillingPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');
  const membership = ctx.membership;
  const done = portalTimer('billing');
  const billing = await getBillingData();
  done();
  const view = billingView(membership, billing);
  const renews = billing && 'subscription' in billing ? billing.subscription?.nextBilling : null;
  const description =
    view === 'included' || view === 'included_with_stripe'
      ? 'Your plan: Founding member. Pro is included.'
      : view === 'stripe'
        ? `Your plan: Pro ${membership.priceLabel || PRO_PRICE_LABEL}. ${membership.status === 'canceled' ? 'Ends' : 'Renews'} ${renews || 'on your Stripe date'}.`
        : view === 'error'
          ? "We couldn't load your billing details right now."
          : 'Your plan: Free. Activate Pro when you want patients to reach you.';
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
          <h2 className="text-lg font-bold text-portal-ink">Founding member: Pro is included. There&apos;s nothing to pay and no card on file.</h2>
          <p className="mt-2 text-sm text-portal-ink-2">
            Questions about your plan? <a className="font-bold text-portal-accent" href="mailto:support@neurochirodirectory.com">Email support@neurochirodirectory.com</a>.
          </p>
        </section>
      ) : null}
      {showStripe && billing && !('error' in billing) && !billing.noCustomer ? (
        <section className="bg-white border border-portal-border rounded-xl p-6 space-y-3">
          {view === 'included_with_stripe' ? (
            <p className="text-sm text-portal-ink-2">Founding member: Pro is included. Card charges below are for extras such as seminar hosting.</p>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-portal-ink">Pro</h2>
            <StatusPill label={billing.subscription?.status || membership.status} tone={billing.subscription?.status === 'active' ? 'booked' : 'follow'} />
          </div>
          {membership.priceLabel ? <p className="text-2xl font-bold text-portal-ink">{membership.priceLabel}</p> : <p className="text-2xl font-bold text-portal-ink">Pro included</p>}
          {billing.subscription?.paymentMethod ? <p className="text-sm text-portal-ink-2">Card ending {billing.subscription.paymentMethod}</p> : null}
          {renews ? <p className="text-sm text-portal-ink-2">{membership.status === 'canceled' ? 'Ends' : 'Renews'} {renews}</p> : null}
          <ManageBillingButton />
        </section>
      ) : null}
      {view === 'free' ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-portal-ink">Activate Pro</h2>
          <p className="mt-1 text-sm text-portal-ink-2">{PRO_PRICE_LABEL} or $490/yr. Cancel anytime.</p>
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
