import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginPathWithReturn } from '@/lib/auth/safe-return-path';
import { after } from 'next/server';
import { AuthProvider } from '@/context/AuthContext';
import PortalShell from '@/components/portal/PortalShell';
import ReferralProvider from '@/components/portal/ReferralProvider';
import OnboardingGate from '@/components/portal/OnboardingGate';
import { PortalProvider } from '@/components/portal/PortalProvider';
import { MemberReferralBanner } from '@/components/portal/MemberReferralInvite';
import { loadMemberInvite } from '@/lib/member-referrals/invite';
import { getPortalContext } from '@/lib/portal/context';
import { recordPortalLogin } from '@/lib/portal/login-ping';
import { firstName } from '@/lib/portal/greeting';
import { isApplicationFlowEnabled } from '@/lib/applications/flag';
import { loadApplicationGate } from '@/lib/applications/gate';
import { lookupStaffOffice } from './kpi/actions';
import StaffScorecardFrame from './StaffScorecardFrame';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

async function ReferralBanner({ doctorId }: { doctorId: string }) {
  const invite = await loadMemberInvite(doctorId);
  if (!invite || invite.dismissed) return null;
  return <MemberReferralBanner title={invite.title} body={invite.body} message={invite.message} />;
}

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const path = headerStore.get('x-pathname') || '';
  const search = headerStore.get('x-search') || '';
  const applying = path === '/doctor/apply' || path.startsWith('/doctor/apply/');
  const ctx = await getPortalContext();
  if (!ctx) {
    if (applying) redirect(loginPathWithReturn(`${path}${search}`));
    redirect('/login');
  }

  after(() => {
    void recordPortalLogin({
      userId: ctx.userId,
      name: ctx.fullName,
      city: ctx.doctor?.city ? `${ctx.doctor.city}${ctx.doctor.state ? `, ${ctx.doctor.state}` : ''}` : null,
      clinic: ctx.doctor?.clinic_name || null,
    });
  });

  const staffOnly = !ctx.doctor && await lookupStaffOffice(ctx.userId);
  if (staffOnly) {
    return (
      <AuthProvider>
        <div className={`${inter.variable} portal min-h-dvh`}>
          <StaffScorecardFrame>{children}</StaffScorecardFrame>
        </div>
      </AuthProvider>
    );
  }

  const callStatus = ctx.doctor?.onboarding_call_status || 'not_booked';
  const applicationGate = isApplicationFlowEnabled() && ctx.doctor?.id
    ? await loadApplicationGate(ctx.doctor.id)
    : null;
  const needsCall = !applicationGate && !ctx.doctor?.is_founding_member && ctx.doctor?.is_approved !== true && callStatus !== 'completed';

  if (applicationGate === 'finish' && path && !applying) redirect('/doctor/apply');

  if (applying) {
    const terminal = applicationGate && applicationGate !== 'finish';
    const completing = path === '/doctor/apply/complete' || path.startsWith('/doctor/apply/complete/');
    if (terminal && !completing) redirect('/doctor/dashboard');
    return (
      <AuthProvider>
        <div className={`${inter.variable} min-h-dvh bg-neuro-cream`}>
          <PortalProvider value={ctx}>
            {children}
          </PortalProvider>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className={`${inter.variable} portal min-h-dvh`}>
        <PortalProvider value={ctx}>
          <ReferralProvider>
            <OnboardingGate needsCall={needsCall} callStatus={callStatus} doctorName={firstName(ctx.fullName) === 'there' ? ctx.fullName : ctx.fullName} applicationGate={applicationGate}>
              <PortalShell banner={ctx.doctor ? <Suspense fallback={null}><ReferralBanner doctorId={ctx.doctor.id} /></Suspense> : null}>{children}</PortalShell>
            </OnboardingGate>
          </ReferralProvider>
        </PortalProvider>
      </div>
    </AuthProvider>
  );
}
