import { redirect } from 'next/navigation';
import ReferralHistory from '@/components/portal/ReferralHistory';
import { getPortalContext } from '@/lib/portal/context';
import { listMyReferrals } from '@/lib/referrals/data';
import { getDoctorTimezone } from '@/lib/doctor-timezone';

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getPortalContext();
  if (!ctx?.doctor) redirect('/login');
  const tab = (await searchParams).tab === 'sent' ? 'sent' : 'received';
  const data = await listMyReferrals();
  return (
    <ReferralHistory
      tab={tab}
      sent={data?.sent || []}
      received={data?.received || []}
      waiting={ctx.unreadReferrals}
      timeZone={getDoctorTimezone(ctx.doctor.state, ctx.doctor.country, 'UTC')}
    />
  );
}
