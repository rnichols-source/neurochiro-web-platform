import Link from 'next/link';
import CheckoutButton from '@/components/student/CheckoutButton';
import PageHeader from '@/components/portal/PageHeader';
import { STUDENT_CONFIG } from '@/config/students';
import { getStudentPortal } from '@/lib/students/context';
import { hasMemberAccess } from '@/lib/students/membership-pure';

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ plan?: string; canceled?: string }> }) {
  const params = await searchParams;
  const plan = params.plan === 'annual' ? 'annual' : 'monthly';
  const portal = await getStudentPortal();
  const member = portal ? hasMemberAccess(portal.membership) : false;
  const monthly = STUDENT_CONFIG.membership.monthly.usd;
  const annual = STUDENT_CONFIG.membership.annual.usd;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <PageHeader title="Student membership" description={STUDENT_CONFIG.membership.tagline} />
      {params.canceled ? <p className="mb-4 text-base text-portal-ink-2">Checkout was canceled. Your free account is still here.</p> : null}
      {member ? (
        <article className="bg-white border border-portal-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-portal-ink">You already have access</h2>
          <p className="mt-2 text-base text-portal-ink-2">{portal?.membership.priceLabel}</p>
          <Link href="/student/billing" className="mt-4 min-h-11 inline-flex items-center rounded-lg bg-portal-ink px-4 text-base font-bold text-white">Manage billing</Link>
        </article>
      ) : (
        <article className="bg-white border border-portal-border rounded-xl p-6 space-y-4">
          <p className="text-base text-portal-ink">${monthly}/month or ${annual}/year. The yearly plan is two months free. Cancel anytime. No free trial.</p>
          <CheckoutButton plan={plan} label={plan === 'annual' ? `Continue with $${annual}/year` : `Continue with $${monthly}/month`} />
          <Link href={plan === 'annual' ? '/student/subscribe?plan=monthly' : '/student/subscribe?plan=annual'} className="inline-flex min-h-11 items-center text-base font-bold text-portal-ink">
            {plan === 'annual' ? `Switch to $${monthly}/month` : `Switch to $${annual}/year`}
          </Link>
        </article>
      )}
    </div>
  );
}
