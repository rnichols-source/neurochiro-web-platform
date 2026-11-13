import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginPathWithReturn } from '@/lib/auth/safe-return-path';
import { after } from 'next/server';
import { AuthProvider } from '@/context/AuthContext';
import DoctorShell from '@/components/doctor/shell';
import ReferralProvider from '@/components/portal/ReferralProvider';
import OnboardingGate from '@/components/portal/OnboardingGate';
import { PortalProvider } from '@/components/portal/PortalProvider';
import { getPortalContext } from '@/lib/portal/context';
import { recordPortalLogin } from '@/lib/portal/login-ping';
import { firstName } from '@/lib/portal/greeting';
import { isApplicationFlowEnabled } from '@/lib/applications/flag';
import { loadApplicationGate } from '@/lib/applications/gate';
import { lookupStaffOffice } from './kpi/actions';
import StaffScorecardFrame from './StaffScorecardFrame';
import { countWaitingVisits } from '@/lib/doctor/portal-data';

export const dynamic = 'force-dynamic'

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
        <div className="portal min-h-dvh" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
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
        <div className="min-h-dvh bg-neuro-cream" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
          <PortalProvider value={ctx}>
            {children}
          </PortalProvider>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="portal min-h-dvh" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
        <PortalProvider value={ctx}>
          <ReferralProvider>
            <OnboardingGate needsCall={needsCall} callStatus={callStatus} doctorName={firstName(ctx.fullName) === 'there' ? ctx.fullName : ctx.fullName} applicationGate={applicationGate}>
              <DoctorShell waiting={ctx.doctor ? await countWaitingVisits(ctx.doctor.id) : 0}>
                {children}
              </DoctorShell>
            </OnboardingGate>
          </ReferralProvider>
        </PortalProvider>
      </div>
    </AuthProvider>
  );
}
