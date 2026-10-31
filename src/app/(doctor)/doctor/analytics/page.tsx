import { BarChart3 } from 'lucide-react';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/portal/PageHeader';
import StatList from '@/components/portal/StatList';
import EmptyState from '@/components/portal/EmptyState';
import { getPortalContext } from '@/lib/portal/context';
import { getDoctorPortalStats } from '@/lib/portal/stats-load';

export default async function DoctorAnalytics() {
  const ctx = await getPortalContext();
  if (!ctx?.doctor) redirect('/login');

  const stats = await getDoctorPortalStats({
    doctorId: ctx.doctor.id,
    userId: ctx.userId,
    range: '30d',
    city: ctx.doctor.city,
    profileViews: ctx.doctor.profile_views,
  });
  const profileViews = stats.viewsInRange ?? stats.profileViews;
  const patientRequests = stats.patientRequests.total;
  const profileClicks = stats.profileClicks;
  const empty = profileViews === 0 && patientRequests === 0 && profileClicks === 0;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Results" description="How patients find you, over the last 30 days." />
      {empty ? (
        <EmptyState
          icon={BarChart3}
          title="No results yet"
          sentence="When patients open your profile or ask to book, the counts show up here."
        />
      ) : (
        <StatList
          title="Last 30 days"
          rows={[
            {
              label: 'Profile views',
              value: profileViews.toLocaleString(),
              hint: 'Profile views: people who opened your public profile in the last 30 days. If that log is missing, this is the all-time total.',
            },
            {
              label: 'Patient requests',
              value: String(patientRequests),
              hint: 'Patient requests: people who asked to book with you in the last 30 days.',
            },
            {
              label: 'Profile clicks',
              value: String(profileClicks),
              hint: 'Profile clicks: times someone clicked through to your profile in the last 30 days.',
            },
          ]}
        />
      )}
    </div>
  );
}
