import Link from 'next/link';
import { Suspense } from 'react';
import PageHeader from '@/components/portal/PageHeader';
import StatList from '@/components/portal/StatList';
import LineChart from '@/components/portal/LineChart';
import { getPortalContext } from '@/lib/portal/context';
import { greeting, firstName } from '@/lib/portal/greeting';
import { getDoctorTimezone } from '@/lib/doctor-timezone';
import { getDoctorPortalStats } from '@/lib/portal/stats-load';
import { getFeature } from '@/lib/portal/features';
import { redirect } from 'next/navigation';
import SetupChecklist from './setup-checklist';
import AttentionList from './attention-list';
import InviteColleague from './invite-colleague';
import { ReferButton } from '@/components/portal/ReferralProvider';
import { getAttention, getSetupFields, getViewSeries } from './home-data';

function Card({ children }: { children: React.ReactNode }) {
  return <section className="bg-white border border-portal-border rounded-xl p-4">{children}</section>;
}

async function DashboardBody() {
  const ctx = await getPortalContext();
  if (!ctx?.doctor) redirect('/login');
  const doctor = ctx.doctor;
  const timeZone = getDoctorTimezone(doctor.state, doctor.country, 'America/New_York') || 'America/New_York';
  const hello = `${greeting(new Date(), timeZone)}, Dr. ${firstName(ctx.fullName)}`;
  const profilePath = doctor.slug ? `/directory/${doctor.slug}` : '/doctor/profile';
  const [stats, fields, attention, points] = await Promise.all([
    getDoctorPortalStats({
      doctorId: doctor.id,
      userId: ctx.userId,
      range: 'month',
      city: doctor.city,
      profileViews: doctor.profile_views,
    }),
    getSetupFields(doctor.id),
    getAttention(doctor.id, ctx.userId),
    getViewSeries(doctor.id),
  ]);
  const lives = getFeature('lives');
  const showLives = lives && lives.state !== 'hidden' && lives.state !== 'coming_soon';
  const plan = ctx.membership.isFounder
    ? 'Founding member'
    : ctx.membership.priceLabel || (ctx.membership.source === 'comped' ? 'Included' : 'Free');

  return (
    <div className="space-y-6" data-patient-requests={stats.patientRequests.total}>
      <PageHeader
        title={hello}
        description="Here's what needs you today."
        action={<ReferButton />}
      />
      <p className="text-sm text-portal-ink-2 -mt-4">
        {doctor.clinic_name || 'Your practice'}
        {doctor.slug ? (
          <>
            {' · '}
            <Link href={profilePath} target="_blank" className="text-portal-accent font-bold">View my public profile</Link>
          </>
        ) : null}
      </p>
      <SetupChecklist fields={fields} profileUrl={doctor.slug ? `https://neurochiro.co/directory/${doctor.slug}` : 'https://neurochiro.co'} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <AttentionList items={attention} />
          <Card>
            <h2 className="text-lg font-bold text-portal-ink">Profile views</h2>
            <p className="text-sm text-portal-muted mb-2">All time: {stats.profileViews.toLocaleString()}</p>
            <LineChart points={points} />
          </Card>
        </div>
        <div className="space-y-4">
          <StatList
            title="This month"
            rows={[
              { label: 'Profile views', value: (stats.viewsInRange ?? stats.profileViews).toLocaleString(), hint: 'Profile views: people who opened your public profile. The all-time total is on the chart. This number is views in the current month when that log exists.' },
              { label: 'New leads', value: String(stats.patientRequests.total), hint: 'Patient requests: people who asked to book with you through NeuroChiro this month.' },
              { label: 'Referrals sent', value: String(stats.referralsSent), hint: 'Referrals sent: patients you sent to another doctor this month.' },
              { label: 'Referrals received', value: String(stats.referralsReceived), hint: 'Referrals received: patients other doctors sent you this month.' },
            ]}
          />
          <Card>
            <h2 className="text-lg font-bold text-portal-ink">Your membership</h2>
            <p className="text-sm text-portal-ink-2 mt-1">Your plan: {plan}</p>
            <ul className="mt-3 space-y-2 text-sm text-portal-ink-2">
              <li>Network profile, so patients can find you on neurochiro.co.</li>
              <li>{stats.patientRequests.total} new lead{stats.patientRequests.total === 1 ? '' : 's'} this month.</li>
              {showLives ? <li>The Weekly Adjustment. Thursday at 8 PM ET.</li> : null}
              <li>Spotlight interview. We will reach out to schedule.</li>
              <li>Content rotation. We will reach out to schedule.</li>
            </ul>
            <Link href="/doctor/billing" className="mt-3 min-h-11 inline-flex items-center text-sm font-bold text-portal-accent">Plan and billing</Link>
          </Card>
          <InviteColleague initialCode={null} />
        </div>
      </div>
      {stats.market ? (
        <Card>
          <h2 className="text-lg font-bold text-portal-ink">Your market</h2>
          <p className="text-sm text-portal-ink-2 mt-1">Rank {stats.market.rank} of {stats.market.total} verified doctors in {doctor.city}. Average profile views: {stats.market.avgViews}.</p>
        </Card>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-40 bg-white border border-portal-border rounded-xl animate-pulse" />}>
      <DashboardBody />
    </Suspense>
  );
}
