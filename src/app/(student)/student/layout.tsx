import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import MemberGate, { SoonNotice } from '@/components/student/MemberGate';
import { StudentPortalProvider } from '@/components/student/StudentPortalProvider';
import StudentShell from '@/components/student/StudentShell';
import { featureForPath } from '@/config/student-features';
import { getStudentPortal, isStaffRole } from '@/lib/students/context';
import { hasMemberAccess } from '@/lib/students/membership-pure';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const WELCOME_EXEMPT = ['/student/welcome', '/student/subscribe', '/student/billing', '/student/settings'];

const COPY: Record<string, string> = {
  roadmap: 'A plain checklist from year 1 through your first 90 days in practice.',
  mentorship: 'One live call a month with Dr. Ray and a guest doctor. Recordings stay in the library.',
  chiromatch: 'You and a practice both say yes before anyone is introduced.',
  academy: 'Courses on how a nervous-system practice actually runs.',
  interview_prep: 'The questions doctors ask, and how to answer them.',
  contract_lab: 'A second set of eyes on an associate contract before you sign.',
  financial_planner: 'Loans, pay, and a first-year budget with your own numbers.',
  community: 'A student directory will live here once there are people to show.',
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const portal = await getStudentPortal();
  if (!portal) redirect('/login?redirect=/student/dashboard');
  if (portal.role === 'doctor') redirect('/doctor/dashboard');
  if (portal.role === 'patient') redirect('/portal');
  if (portal.role !== 'student' && !isStaffRole(portal.role)) redirect('/');

  const path = (await headers()).get('x-pathname') || '';
  const needsWelcome = portal.role === 'student' && !portal.school && !portal.graduationYear;
  if (path && needsWelcome && !WELCOME_EXEMPT.some((item) => path === item || path.startsWith(`${item}/`))) {
    redirect('/student/welcome');
  }

  const feature = path ? featureForPath(path) : null;
  let body = children;
  if (feature?.key === 'legacy_chiromatch' || feature?.state === 'hidden') {
    body = (
      <SoonNotice
        feature="ChiroMatch"
        description="The old ranking rounds are closed. Always-on matching is next. You and a practice will both say yes before a conversation starts."
      />
    );
  } else if (feature?.state === 'coming_soon') {
    body = <SoonNotice feature={feature.label} description={COPY[feature.key] || 'This is being finished. You will get an email when it is ready.'} />;
  } else if (feature?.requires === 'member' && !hasMemberAccess(portal.membership)) {
    body = <MemberGate feature={feature.label} description={COPY[feature.key] || 'This is part of student membership.'} />;
  }

  return (
    <AuthProvider>
      <div className={`${inter.variable} portal min-h-dvh`}>
        <StudentPortalProvider value={portal}>
          <StudentShell>{body}</StudentShell>
        </StudentPortalProvider>
      </div>
    </AuthProvider>
  );
}
