export const STUDENT_PLACES = {
  home: { id: 'home', href: '/student/dashboard', label: 'Home', color: '#D66829', ink: '#B4501A', tint: '#FCEBDF' },
  call: { id: 'call', href: '/student/mentorship', label: 'Call', color: '#0E857A', ink: '#0A6159', tint: '#DCF1EE' },
  match: { id: 'match', href: '/student/doctors', label: 'Match', color: '#2C6BB4', ink: '#1F4F8C', tint: '#E2ECF8' },
  jobs: { id: 'jobs', href: '/student/jobs', label: 'Jobs', color: '#7A4A94', ink: '#5C3473', tint: '#EFE5F5' },
  me: { id: 'me', href: '/student/profile', label: 'Me', color: '#1E2D3B', ink: '#1E2D3B', tint: '#E5E9EE' },
} as const;

export type StudentPlaceId = keyof typeof STUDENT_PLACES;
export const STUDENT_PLACE_LIST = [
  STUDENT_PLACES.home,
  STUDENT_PLACES.call,
  STUDENT_PLACES.match,
  STUDENT_PLACES.jobs,
  STUDENT_PLACES.me,
] as const;

export type StudentToolGroup = 'learn' | 'people' | 'account';

export const STUDENT_TOOL_GROUPS: { id: StudentToolGroup; label: string; place: StudentPlaceId }[] = [
  { id: 'learn', label: 'Student tools', place: 'home' },
  { id: 'people', label: 'People', place: 'match' },
  { id: 'account', label: 'Account', place: 'me' },
];

export const STUDENT_TOOL_LINKS: { href: string; label: string; detail: string; group: StudentToolGroup }[] = [
  { href: '/student/philosophy', label: 'Philosophy', detail: 'How nervous-system chiropractic thinks', group: 'learn' },
  { href: '/student/techniques', label: 'Technique finder', detail: 'Compare techniques and take the quiz', group: 'learn' },
  { href: '/student/contract-lab', label: 'Contracts', detail: 'Read an associate contract before you sign', group: 'learn' },
  { href: '/student/seminars', label: 'Seminars', detail: 'Classes and events you can attend', group: 'learn' },
  { href: '/student/financial-planner', label: 'Financial planner', detail: 'Loans, pay, and a first-year budget', group: 'learn' },
  { href: '/student/match', label: 'ChiroMatch', detail: 'See how you line up with opted-in doctors', group: 'people' },
  { href: '/student/messages', label: 'Messages', detail: 'Conversations with doctors', group: 'people' },
  { href: '/student/billing', label: 'Billing', detail: 'Membership and receipts', group: 'account' },
  { href: '/student/settings', label: 'Settings', detail: 'Notifications and account', group: 'account' },
  { href: '/student/notifications', label: 'Notifications', detail: 'Jobs, calls, and replies', group: 'account' },
];

const PREFIXES: { prefix: string; id: StudentPlaceId }[] = [
  { prefix: '/student/dashboard', id: 'home' },
  { prefix: '/student/welcome', id: 'home' },
  { prefix: '/student/mentorship', id: 'call' },
  { prefix: '/student/doctors', id: 'match' },
  { prefix: '/student/match', id: 'match' },
  { prefix: '/student/jobs', id: 'jobs' },
  { prefix: '/student/profile', id: 'me' },
  { prefix: '/student/billing', id: 'me' },
  { prefix: '/student/settings', id: 'me' },
  { prefix: '/student/subscribe', id: 'me' },
  { prefix: '/student/notifications', id: 'me' },
];

export function studentNavId(pathname: string): StudentPlaceId | null {
  const match = PREFIXES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  return match?.id ?? null;
}
