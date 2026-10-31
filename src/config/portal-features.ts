// Flip a feature by changing its `state` on one line below.
// live: shown and usable.
// beta: shown with a "Beta" chip.
// coming_soon: listed on /doctor/coming-soon, not in the main nav.
// hidden: not shown. neuros stays hidden until neuros_tier is set.
// RAYMOND: approve or flip these states. ChiroMatch becomes live on its own while a cycle is open.

export type FeatureState = 'live' | 'beta' | 'coming_soon' | 'hidden';

export type PortalFeature = {
  key: string;
  label: string;
  href: string;
  group: 'main' | 'grow' | 'tools' | 'account';
  subtitle: string;
  state: FeatureState;
  requires?: 'pro' | 'practice_tools' | 'neuros' | 'owned_purchase';
  comingSoonBlurb?: string;
  icon: string;
};

export const PORTAL_FEATURES: PortalFeature[] = [
  { key: 'dashboard', label: 'Home', href: '/doctor/dashboard', group: 'main', subtitle: 'Your day at a glance', state: 'live', icon: 'LayoutDashboard' },
  { key: 'leads', label: 'Patient requests', href: '/doctor/leads', group: 'main', subtitle: 'New patients asking to book', state: 'live', requires: 'pro', icon: 'Target' },
  { key: 'messages', label: 'Messages', href: '/doctor/messages', group: 'main', subtitle: 'Conversations with patients and doctors', state: 'live', icon: 'MessageSquare' },
  { key: 'profile', label: 'My profile', href: '/doctor/profile', group: 'main', subtitle: 'What patients see', state: 'live', icon: 'User' },
  { key: 'analytics', label: 'Results', href: '/doctor/analytics', group: 'grow', subtitle: 'Views, requests, where they came from', state: 'live', requires: 'pro', icon: 'BarChart3' },
  { key: 'seminars', label: 'Seminars', href: '/doctor/seminars', group: 'grow', subtitle: 'Host or find a seminar', state: 'live', icon: 'Calendar' },
  { key: 'hiring', label: 'Hiring', href: '/doctor/jobs', group: 'grow', subtitle: 'Jobs, students, and ChiroMatch', state: 'live', icon: 'Briefcase' },
  { key: 'students', label: 'Students', href: '/doctor/students', group: 'grow', subtitle: 'Browse students looking for a practice', state: 'beta', requires: 'pro', icon: 'GraduationCap' },
  { key: 'chiromatch', label: 'ChiroMatch', href: '/doctor/chiromatch', group: 'grow', subtitle: 'Match with graduating students', state: 'coming_soon', requires: 'pro', comingSoonBlurb: 'ChiroMatch opens when a cycle is running. You will be able to rank graduating students from here.', icon: 'Shuffle' },
  // RAYMOND: confirm the show is running; else coming_soon
  { key: 'lives', label: 'The Weekly Adjustment', href: '/doctor/lives', group: 'grow', subtitle: 'Live show every Thursday 8 PM ET', state: 'beta', icon: 'Video' },
  { key: 'referrals', label: 'Referrals', href: '/doctor/referrals', group: 'grow', subtitle: 'Refer a patient to another doctor', state: 'live', requires: 'pro', icon: 'Users' },
  { key: 'community', label: 'Community', href: '/doctor/community', group: 'grow', subtitle: 'Private doctor community', state: 'coming_soon', comingSoonBlurb: 'A private place for doctors in the network. We will tell you when it opens.', icon: 'Users' },
  { key: 'marketplace', label: 'Marketplace', href: '/doctor/marketplace', group: 'grow', subtitle: 'Vetted vendors with member deals', state: 'beta', icon: 'ShoppingBag' },
  { key: 'practice_tools', label: 'Practice tools', href: '/doctor/tools', group: 'tools', subtitle: 'Care plan, scan reports, KPIs, P&L, CE, billing guide', state: 'live', requires: 'practice_tools', icon: 'Wrench' },
  { key: 'care_plan_closer', label: 'Services from Dr. Ray', href: '/doctor/care-plan-closer', group: 'tools', subtitle: 'Done-for-you care plan setup', state: 'live', icon: 'Calculator' },
  { key: 'purchases', label: 'My purchases', href: '/doctor/purchases', group: 'tools', subtitle: 'Kits you have bought', state: 'live', requires: 'owned_purchase', icon: 'ShoppingBag' },
  { key: 'badges', label: 'Achievements', href: '/doctor/badges', group: 'tools', subtitle: '', state: 'hidden', icon: 'Award' },
  { key: 'neuros', label: 'Neuros program', href: '/doctor/neuros', group: 'tools', subtitle: '', state: 'hidden', requires: 'neuros', icon: 'ShieldCheck' },
  { key: 'notifications', label: 'Notifications', href: '/doctor/notifications', group: 'account', subtitle: '', state: 'live', icon: 'Bell' },
  { key: 'billing', label: 'Plan & billing', href: '/doctor/billing', group: 'account', subtitle: 'Your plan, invoices, payment method', state: 'live', icon: 'CreditCard' },
  { key: 'settings', label: 'Settings', href: '/doctor/settings', group: 'account', subtitle: 'Notifications, account', state: 'live', icon: 'Settings' },
  { key: 'help', label: 'Help', href: '/doctor/help', group: 'account', subtitle: 'Ask us anything', state: 'live', icon: 'CircleHelp' },
];

// Messaging hardening migration has been run. Send safety checks stay on either way.
export const messagingV2: FeatureState = 'live';
