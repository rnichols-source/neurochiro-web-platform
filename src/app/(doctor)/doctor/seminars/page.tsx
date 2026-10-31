import { redirect } from 'next/navigation';
import { getPortalContext } from '@/lib/portal/context';
import { portalTimer } from '@/lib/portal/timing';
import { loadDoctorSeminars, loadEnhancedSeminarAnalytics, loadRecommendedSeminars } from './load';
import SeminarsClient from './SeminarsClient';

export default async function SeminarsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');
  const done = portalTimer('seminars');
  const focus = {
    city: ctx.doctor?.city,
    state: ctx.doctor?.state,
    specialties: ctx.doctor?.specialties || [],
  };
  const recommendedPromise = loadRecommendedSeminars(ctx.userId, focus);
  const seminars = await loadDoctorSeminars(ctx.userId);
  const seminarIds = (seminars as { id?: string }[]).map((seminar) => seminar.id).filter((id): id is string => Boolean(id));
  const analytics = await loadEnhancedSeminarAnalytics(seminarIds);
  const recommended = await recommendedPromise;
  done();
  return (
    <SeminarsClient
      initialSeminars={seminars}
      initialAnalytics={analytics}
      initialRecommended={recommended}
    />
  );
}
