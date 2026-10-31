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
  const profileClicks = stats.profileClicks;
  const introductions = stats.introductions;
  const referrals = stats.referralsReceived;
  const sourceSum = (stats.requestSources || []).reduce((sum, row) => sum + row.count, 0);
  const foundRows = [
    ...(stats.requestSources || []).filter((row) => row.count > 0).map((row) => ({
      label: row.label,
      value: String(row.count),
      hint: 'Patient requests from this source in the last 30 days. Each person is counted once.',
    })),
    ...(introductions != null && introductions > 0
      ? [{ label: 'Directory introductions', value: String(introductions), hint: 'Introductions the directory sent, separate from a patient request.' }]
      : []),
    ...(referrals != null && referrals > 0
      ? [{ label: 'Referrals from doctors', value: String(referrals), hint: 'Patients other doctors referred to you in the last 30 days.' }]
      : []),
  ];
  const empty = profileViews === 0 && patientRequests === 0 && profileClicks === 0 && (introductions === 0 || introductions == null) && (referrals === 0 || referrals == null) && foundRows.length === 0;
  const viewRow = displayCount(
    profileViews,
    viewsKnown
      ? 'Profile views: people who opened your public profile in the last 30 days.'
      : `Profile views for the last 30 days start once view events exist. All-time total: ${stats.profileViews.toLocaleString()}. ${UNAVAILABLE_HINT}`,
  );
  const requestRow = displayCount(patientRequests, PATIENT_REQUESTS_HINT);
  const clickRow = displayCount(profileClicks, 'Profile clicks: times someone clicked through to your profile in the last 30 days.');
  const introRow = displayCount(introductions, 'Patients the directory sent you: introductions from the directory in the last 30 days. This is separate from doctor-to-doctor referrals.');

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
            { label: 'Profile clicks', value: clickRow.value, hint: clickRow.hint },
            { label: 'Patients the directory sent you', value: introRow.value, hint: introRow.hint },
          ]}
        />
      )}
      {foundRows.length > 0 ? (
        <div className="space-y-2">
          <StatList title="How patients found you · last 30 days" rows={foundRows} />
          {patientRequests != null && stats.requestSources && sourceSum !== patientRequests ? (
            <p className="text-sm text-portal-ink-2">These sources do not add up to patient requests because some people were counted once.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
