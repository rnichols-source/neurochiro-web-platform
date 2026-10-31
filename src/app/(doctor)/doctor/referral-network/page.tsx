import { redirect } from 'next/navigation';

export default async function ReferralNetworkRedirect({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab;
  const allowed = tab === 'sent' || tab === 'received' ? tab : '';
  redirect(allowed ? `/doctor/referrals?tab=${allowed}` : '/doctor/referrals');
}
