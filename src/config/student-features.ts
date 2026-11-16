import type { FeatureState } from '@/config/portal-features';

export type StudentFeature = {
  key: string;
  label: string;
  href: string;
  group: 'main' | 'place' | 'ready' | 'protect' | 'seminars' | 'account';
  state: FeatureState;
  requires?: 'member';
};

export const STUDENT_FEATURES: StudentFeature[] = [
  { key: 'home', label: 'Home', href: '/student/dashboard', group: 'main', state: 'live' },
  { key: 'mentorship', label: 'Monthly call', href: '/student/mentorship', group: 'main', state: 'beta', requires: 'member' },
  { key: 'doctors', label: 'Doctors', href: '/student/doctors', group: 'place', state: 'live' },
  { key: 'jobs', label: 'Associateships', href: '/student/jobs', group: 'place', state: 'live' },
  { key: 'chiromatch', label: 'ChiroMatch', href: '/student/match', group: 'place', state: 'live' },
  { key: 'techniques', label: 'Techniques', href: '/student/techniques', group: 'ready', state: 'live' },
  { key: 'philosophy', label: 'Philosophy', href: '/student/philosophy', group: 'ready', state: 'live' },
  { key: 'interview_prep', label: 'Interview playbook', href: '/student/interview-prep', group: 'ready', state: 'live' },
  { key: 'contract_lab', label: 'Contract Lab', href: '/student/contract-lab', group: 'protect', state: 'live', requires: 'member' },
  { key: 'financial_planner', label: 'Financial planner', href: '/student/financial-planner', group: 'protect', state: 'live' },
  { key: 'seminars', label: 'Seminars', href: '/student/seminars', group: 'seminars', state: 'live' },
  { key: 'messages', label: 'Messages', href: '/student/messages', group: 'account', state: 'live' },
  { key: 'notifications', label: 'Notifications', href: '/student/notifications', group: 'account', state: 'live' },
  { key: 'settings', label: 'Settings', href: '/student/settings', group: 'account', state: 'live' },
  { key: 'billing', label: 'Billing', href: '/student/billing', group: 'account', state: 'live' },
];

export function visibleStudentFeatures() {
  return STUDENT_FEATURES.filter((feature) => feature.state !== 'hidden');
}

export function featureForPath(path: string): StudentFeature | null {
  const matches = STUDENT_FEATURES.filter((feature) => path === feature.href || path.startsWith(`${feature.href}/`));
  matches.sort((a, b) => b.href.length - a.href.length);
  return matches[0] ?? null;
}
