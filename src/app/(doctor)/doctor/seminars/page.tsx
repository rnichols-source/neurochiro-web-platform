import { redirect } from 'next/navigation';
import { getPortalContext } from '@/lib/portal/context';
import { portalTimer } from '@/lib/portal/timing';
import { loadDoctorSeminars, loadEnhancedSeminarAnalytics, loadRecommendedSeminars } from './load';
import SeminarsClient from './SeminarsClient';

export default async function SeminarsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');
  const done = portalTimer('seminars');
  const [seminars, analytics, recommended] = await Promise.all([
    loadDoctorSeminars(ctx.userId),
    loadEnhancedSeminarAnalytics(ctx.userId),
    loadRecommendedSeminars(ctx.userId, {
      city: ctx.doctor?.city,
      state: ctx.doctor?.state,
      specialties: ctx.doctor?.specialties || [],
    }),
  ]);
  done();
  return (
    <SeminarsClient
      initialSeminars={seminars}
      initialAnalytics={analytics}
      initialRecommended={recommended}
    />
  );
}
