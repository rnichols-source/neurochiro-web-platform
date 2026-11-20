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
import { SavedItemsSeed } from '@/components/portal/saved-seed';
import { SmsPromptBanner } from '@/components/doctor/SmsPromptBanner';
import type { ApplicationGate } from '@/lib/applications/gate';
import StaffScorecardFrame from './StaffScorecardFrame';
import { practiceAccessForUser } from '@/lib/doctor/practice-access';

export const dynamic = 'force-dynamic'
export const preferredRegion = 'pdx1'

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

  const staffOnly = !ctx.doctor && ctx.staffOffice;
  if (staffOnly) {
    const practice = await practiceAccessForUser(ctx.userId);
    return (
      <AuthProvider>
        <div className="portal min-h-dvh" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
          <PortalProvider value={ctx}>
            <StaffScorecardFrame clinic={practice?.clinicName || null}>{children}</StaffScorecardFrame>
          </PortalProvider>
        </div>
      </AuthProvider>
    );
  }

  const callStatus = ctx.doctor?.onboarding_call_status || 'not_booked';
  const applicationGate = ctx.applicationGate;
  const needsCall = !applicationGate && !ctx.doctor?.is_founding_member && ctx.doctor?.is_approved !== true && callStatus !== 'completed';

  if (applicationGate === 'finish' && path && !applying) redirect('/doctor/apply');

  if (applying) {
    const completing = path === '/doctor/apply/complete' || path.startsWith('/doctor/apply/complete/');
    const canStay = !applicationGate || applicationGate === 'finish' || applicationGate === 'needs_action';
    if (!canStay && !completing) redirect('/doctor/dashboard');
    return (
      <AuthProvider>
        <div className="min-h-dvh overflow-x-hidden bg-neuro-cream" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
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
          <SavedItemsSeed items={ctx.savedItems} />
          <ReferralProvider>
            <OnboardingGate needsCall={needsCall} callStatus={callStatus} doctorName={firstName(ctx.fullName) === 'there' ? ctx.fullName : ctx.fullName} applicationGate={applicationGate as ApplicationGate | null}>
              <DoctorShell waiting={ctx.waitingVisits}>
                {ctx.doctor?.id ? <SmsPromptBanner doctorId={ctx.doctor.id} /> : null}
                {children}
              </DoctorShell>
            </OnboardingGate>
          </ReferralProvider>
        </PortalProvider>
      </div>
    </AuthProvider>
  );
}
