import PageHeader from '@/components/portal/PageHeader';
import StatusPill from '@/components/portal/StatusPill';
import { getBillingData } from './actions';
import { ActivateProButtons, ManageBillingButton } from './BillingButtons';
import { getPortalContext } from '@/lib/portal/context';
import { PRO_PRICE_LABEL } from '@/lib/portal/membership';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');
  const membership = ctx.membership;
  const billing = await getBillingData();
  const included = membership.isFounder || membership.source === 'comped' || membership.source === 'founding';
  const renews = billing && 'subscription' in billing ? billing.subscription?.nextBilling : null;
  const description = included
    ? 'Your plan: Founding member. Pro included.'
    : membership.source === 'stripe'
      ? `Your plan: Pro ${membership.priceLabel || PRO_PRICE_LABEL}. ${membership.status === 'canceled' ? 'Ends' : 'Renews'} ${renews || 'on your Stripe date'}.`
      : 'Your plan: Free. Activate Pro when you want patients to reach you.';

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description={description} />
      {included ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold">Founding member: Pro included</h2>
          <p className="mt-2 text-sm text-portal-ink-2">Your Pro access stays on this account. There is no separate Activate Pro step.</p>
        </section>
      ) : null}
      {!included && membership.source === 'stripe' && billing && !('error' in billing) && !billing.noCustomer ? (
        <section className="bg-white border border-portal-border rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Pro</h2>
            <StatusPill label={billing.subscription?.status || membership.status} tone={billing.subscription?.status === 'active' ? 'booked' : 'follow'} />
          </div>
          <p className="text-2xl font-bold">{membership.priceLabel || PRO_PRICE_LABEL}</p>
          {billing.subscription?.paymentMethod ? <p className="text-sm text-portal-ink-2">Card ending {billing.subscription.paymentMethod}</p> : null}
          {renews ? <p className="text-sm text-portal-ink-2">{membership.status === 'canceled' ? 'Ends' : 'Renews'} {renews}</p> : null}
          <ManageBillingButton />
        </section>
      ) : null}
      {!included && membership.tier === 'free' ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold">Activate Pro</h2>
          <p className="mt-1 text-sm text-portal-ink-2">{PRO_PRICE_LABEL} or $490/yr. Cancel anytime.</p>
          <div className="mt-4"><ActivateProButtons /></div>
        </section>
      ) : null}
      {billing && 'invoices' in billing && billing.invoices?.length ? (
        <section className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Invoices</h2>
          <ul className="divide-y divide-portal-border">
            {billing.invoices.map((invoice) => (
              <li key={invoice.id}>
                <a href={invoice.url || '#'} target="_blank" rel="noopener noreferrer" className="min-h-11 flex items-center justify-between gap-3 text-sm">
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
