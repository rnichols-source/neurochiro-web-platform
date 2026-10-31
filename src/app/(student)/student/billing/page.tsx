import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import { STUDENT_CONFIG } from '@/config/students';
import { getStudentPortal } from '@/lib/students/context';
import { getStudentBilling } from '@/lib/students/membership';
import { redirect } from 'next/navigation';
import ManageBillingButton from './ManageBillingButton';

export default async function BillingPage() {
  const portal = await getStudentPortal();
  if (!portal) redirect('/login?redirect=/student/billing');
  const membership = await getStudentBilling(portal.userId);
  const monthly = STUDENT_CONFIG.membership.monthly.usd;
  const annual = STUDENT_CONFIG.membership.annual.usd;

  let title = 'No membership yet';
  let body = `Join for $${monthly}/month or $${annual}/year. Cancel anytime.`;
  if (membership.status === 'member' && membership.source === 'grandfathered') {
    title = 'Your plan is active';
    body = membership.priceLabel;
  } else if (membership.status === 'member' && membership.source === 'comped') {
    title = 'Your plan is active';
    body = 'Scholarship access. You do not have a card on file.';
  } else if (membership.status === 'member') {
    title = 'Your plan is active';
    body = `${membership.priceLabel}. ${membership.renewsAt ? `Renews ${new Date(membership.renewsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` : 'Manage the card and the plan in Stripe.'}`;
  } else if (membership.status === 'grace') {
    title = 'You are in the grace period';
    body = membership.renewsAt
      ? `Full access until ${new Date(membership.renewsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. After that, membership is $${monthly}/month or $${annual}/year.`
      : `Full access for a short time, then $${monthly}/month or $${annual}/year.`;
  } else if (membership.status === 'past_due') {
    title = 'Payment failed';
    body = 'Update your card to keep access. You still have access for 7 days from the failed payment.';
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <PageHeader title="Billing" description="One student plan. The tools are included." />
      <article className="bg-white border border-portal-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-portal-ink">{title}</h2>
        <p className="mt-2 text-base text-portal-ink-2">{body}</p>
        <div className="mt-5 flex flex-col gap-3">
          {membership.status === 'member' || membership.status === 'past_due' ? <ManageBillingButton /> : null}
          {membership.status !== 'member' ? (
            <Link href="/student/subscribe?plan=monthly" className="min-h-11 inline-flex items-center justify-center rounded-lg bg-portal-accent px-4 text-base font-bold text-white">
              Join for ${monthly}/month
            </Link>
          ) : null}
        </div>
      </article>
    </div>
  );
}
