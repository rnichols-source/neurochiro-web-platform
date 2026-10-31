import { BarChart3 } from 'lucide-react';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/portal/PageHeader';
import StatList from '@/components/portal/StatList';
import EmptyState from '@/components/portal/EmptyState';
import { getPortalContext } from '@/lib/portal/context';
import { getDoctorPortalStats } from '@/lib/portal/stats-load';
import { getDoctorTimezone } from '@/lib/doctor-timezone';
import { displayCount, PATIENT_REQUESTS_HINT, UNAVAILABLE_HINT } from '@/lib/portal/stats';
import { portalTimer } from '@/lib/portal/timing';

export default async function DoctorAnalytics() {
  const ctx = await getPortalContext();
  if (!ctx?.doctor) redirect('/login');

  const timeZone = getDoctorTimezone(ctx.doctor.state, ctx.doctor.country, 'America/New_York') || 'America/New_York';
  const done = portalTimer('results');
  const stats = await getDoctorPortalStats({
    doctorId: ctx.doctor.id,
    userId: ctx.userId,
    range: '30d',
    city: ctx.doctor.city,
    profileViews: ctx.doctor.profile_views,
    timeZone,
  });
  done();
  const viewsKnown = stats.viewsTrackedSince != null && stats.viewsInRange != null;
  const profileViews = viewsKnown ? stats.viewsInRange : null;
  const patientRequests = stats.patientRequests?.total ?? null;
  const recommendationClicks = stats.recommendationClicks;
  const recommendationsSent = stats.recommendationsSent;
  const referrals = stats.referralsReceived;
  const foundRows = (stats.requestSources || []).filter((row) => row.count > 0).map((row) => ({
    label: row.label,
    value: String(row.count),
    hint: 'Patient requests from this source in the last 30 days. Each person is counted once.',
  }));
  const empty = profileViews === 0 && patientRequests === 0 && recommendationClicks === 0 && (recommendationsSent === 0 || recommendationsSent == null) && (referrals === 0 || referrals == null) && foundRows.length === 0;
  const viewRow = displayCount(
    profileViews,
    viewsKnown
      ? 'Profile views: people who opened your public profile in the last 30 days.'
      : `Profile views for the last 30 days start once view events exist. All-time total: ${stats.profileViews.toLocaleString()}. ${UNAVAILABLE_HINT}`,
  );
  const requestRow = displayCount(patientRequests, PATIENT_REQUESTS_HINT);
  const clickRow = displayCount(recommendationClicks, 'Opened your profile from our link: someone followed a NeuroChiro recommendation link to your profile.');
  const introRow = displayCount(recommendationsSent, 'Times NeuroChiro recommended you: our team suggested your profile to someone looking for a chiropractor (Instagram comments and DMs). Not every one becomes a patient.');

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
            { label: 'Profile views', value: viewRow.value, hint: viewRow.hint },
            { label: 'Patient requests', value: requestRow.value, hint: requestRow.hint },
            { label: 'Times NeuroChiro recommended you', value: introRow.value, hint: introRow.hint },
            { label: 'Opened your profile from our link', value: clickRow.value, hint: clickRow.hint },
          ]}
        />
      )}
      {foundRows.length > 0 ? (
        <StatList title="How patients found you · last 30 days" rows={foundRows} />
      ) : null}
      {referrals != null && referrals > 0 ? (
        <StatList
          title="Referrals from doctors"
          rows={[{
            label: 'Referrals from doctors',
            value: String(referrals),
            hint: 'Patients other doctors referred to you in the last 30 days. These are separate from patient requests.',
          }]}
        />
      ) : null}
    </div>
  );
}
