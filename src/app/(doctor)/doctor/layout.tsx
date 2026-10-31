import { Inter } from 'next/font/google';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { AuthProvider } from '@/context/AuthContext';
import PortalShell from '@/components/portal/PortalShell';
import ReferralProvider from '@/components/portal/ReferralProvider';
import OnboardingGate from '@/components/portal/OnboardingGate';
import { PortalProvider } from '@/components/portal/PortalProvider';
import { getPortalContext } from '@/lib/portal/context';
import { recordPortalLogin } from '@/lib/portal/login-ping';
import { firstName } from '@/lib/portal/greeting';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');

  after(() => {
    void recordPortalLogin({
      userId: ctx.userId,
      name: ctx.fullName,
      city: ctx.doctor?.city ? `${ctx.doctor.city}${ctx.doctor.state ? `, ${ctx.doctor.state}` : ''}` : null,
      clinic: ctx.doctor?.clinic_name || null,
    });
  });

  const callStatus = ctx.doctor?.onboarding_call_status || 'not_booked';
  const needsCall = !ctx.doctor?.is_founding_member && ctx.doctor?.is_approved !== true && callStatus !== 'completed';

  return (
    <AuthProvider>
      <div className={`${inter.variable} portal min-h-dvh`}>
        <PortalProvider value={ctx}>
          <ReferralProvider>
            <OnboardingGate needsCall={needsCall} callStatus={callStatus} doctorName={firstName(ctx.fullName) === 'there' ? ctx.fullName : ctx.fullName}>
              <PortalShell>{children}</PortalShell>
            </OnboardingGate>
          </ReferralProvider>
        </PortalProvider>
      </div>
    </AuthProvider>
  );
}
