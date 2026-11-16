import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import MemberGate, { SoonNotice } from '@/components/student/MemberGate';
import { StudentPortalProvider } from '@/components/student/StudentPortalProvider';
import StudentShell from '@/components/student/StudentShell';
import { featureForPath } from '@/config/student-features';
import { getStudentPortal, isStaffRole } from '@/lib/students/context';
import { hasMemberAccess } from '@/lib/students/membership-pure';
import { studentProfileComplete } from '@/lib/students/onboarding-fields';

const WELCOME_EXEMPT = ['/student/welcome', '/student/subscribe', '/student/billing', '/student/settings'];

const COPY: Record<string, string> = {
  mentorship: 'One live call a month with Dr. Ray and a guest doctor. Recordings stay in the library.',
  contract_lab: 'A second set of eyes on an associate contract before you sign.',
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get('x-pathname') || '';
  if (path === '/student/verify') return children;

  const portal = await getStudentPortal();
  if (!portal) redirect('/login?redirect=/student/dashboard');
  if (portal.role === 'doctor') redirect('/doctor/dashboard');
  if (portal.role === 'patient') redirect('/portal');
  if (portal.role !== 'student' && !isStaffRole(portal.role)) redirect('/');

  const needsWelcome = portal.role === 'student' && !studentProfileComplete(portal);
  if (path && needsWelcome && !WELCOME_EXEMPT.some((item) => path === item || path.startsWith(`${item}/`))) {
    redirect('/student/welcome');
  }

  const feature = path ? featureForPath(path) : null;
  let body = children;
  if (feature?.state === 'coming_soon') {
    body = <SoonNotice feature={feature.label} description={COPY[feature.key] || 'This is being finished. You will get an email when it is ready.'} />;
  } else if (feature?.requires === 'member' && !hasMemberAccess(portal.membership)) {
    body = <MemberGate feature={feature.label} description={COPY[feature.key] || 'This is part of student membership.'} />;
  }

  return (
    <AuthProvider>
      <div className="portal min-h-dvh" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
        <StudentPortalProvider value={portal}>
          <StudentShell>{body}</StudentShell>
        </StudentPortalProvider>
      </div>
    </AuthProvider>
  );
}
