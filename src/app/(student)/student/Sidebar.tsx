'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  Lock,
  LogOut,
  Map,
  MessageSquare,
  Phone,
  Settings,
  Shuffle,
  Stethoscope,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { visibleStudentFeatures, type StudentFeature } from '@/config/student-features';
import { useStudentPortal } from '@/components/student/StudentPortalProvider';
import { createClient } from '@/lib/supabase';

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  roadmap: Map,
  mentorship: Phone,
  doctors: Stethoscope,
  jobs: Briefcase,
  chiromatch: Shuffle,
  academy: GraduationCap,
  techniques: BookOpen,
  interview_prep: MessageSquare,
  contract_lab: FileText,
  financial_planner: Wallet,
  seminars: Calendar,
  community: Users,
  messages: MessageSquare,
  notifications: Bell,
  settings: Settings,
  billing: CreditCard,
};

const GROUPS: { key: StudentFeature['group']; label: string | null }[] = [
  { key: 'main', label: null },
  { key: 'place', label: 'Find your place' },
  { key: 'ready', label: 'Get ready' },
  { key: 'protect', label: 'Protect yourself' },
  { key: 'seminars', label: null },
  { key: 'account', label: null },
];

const ACCOUNT_LINKS = new Set(['settings', 'billing']);

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname() || '';
  const portal = useStudentPortal();
  const member = portal.membership.status === 'member' || portal.membership.status === 'grace' || portal.membership.status === 'past_due';
  const features = visibleStudentFeatures().filter((feature) => feature.state === 'live' || feature.state === 'beta' || feature.state === 'coming_soon');
  const name = portal.fullName.trim() || 'Student';
  const initial = name.slice(0, 1).toUpperCase();

  function signOut() {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      window.location.href = '/';
    });
  }

  function renderLink(feature: StudentFeature) {
    const active = pathname === feature.href || pathname.startsWith(`${feature.href}/`);
    const locked = feature.requires === 'member' && !member;
    const Icon = ICONS[feature.key] || Map;
    const unread = feature.key === 'messages' && portal.unreadMessages > 0 ? portal.unreadMessages : 0;
    return (
      <li key={feature.key}>
        <Link
          href={feature.href}
          onClick={onClose}
          aria-current={active ? 'page' : undefined}
          className="sidebar-link min-h-11 flex items-center gap-3 rounded-lg px-3 text-sm font-bold"
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{feature.label}</span>
          {feature.state === 'coming_soon' ? <span className="sidebar-quiet text-xs">Soon</span> : null}
          {locked ? (
            <span className="sidebar-quiet inline-flex" title="Members only">
              <Lock className="w-4 h-4" aria-hidden />
              <span className="sr-only">Members only</span>
            </span>
          ) : null}
          {unread > 0 ? (
            <span className="min-w-5 h-5 px-1 rounded-full bg-portal-accent text-xs font-bold inline-flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Link>
      </li>
    );
  }

  const accountLinks = features.filter((feature) => ACCOUNT_LINKS.has(feature.key));

  return (
    <>
      {isOpen ? <button type="button" className="fixed inset-0 z-[140] bg-black/40 md:hidden" aria-label="Close menu" title="Close menu" onClick={onClose} /> : null}
      <aside className={`portal-sidebar fixed md:static z-[160] inset-y-0 left-0 w-72 shrink-0 bg-portal-sidebar text-white flex flex-col transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-start justify-between gap-2">
          <Link href="/student/dashboard" onClick={onClose}>
            <span className="block text-sm font-bold">NeuroChiro</span>
            <span className="sidebar-quiet block text-xs truncate">{name}</span>
          </Link>
          <button type="button" className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center" aria-label="Close menu" title="Close menu" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav aria-label="Student" className="flex-1 overflow-y-auto px-2 py-3">
          {GROUPS.map((group) => {
            const items = features.filter((feature) => feature.group === group.key && feature.key !== 'ce_tracker' && !ACCOUNT_LINKS.has(feature.key));
            if (!items.length) return null;
            const showLabel = Boolean(group.label) && !(items.length === 1 && items[0].label === group.label);
            return (
              <div key={group.key} className="mb-2">
                {showLabel ? <p className="sidebar-quiet px-3 pt-2 pb-1 text-xs">{group.label}</p> : null}
                <ul>{items.map(renderLink)}</ul>
              </div>
            );
          })}
          {accountLinks.length ? (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="sidebar-quiet px-3 pt-2 pb-1 text-xs">Account</p>
              <ul>{accountLinks.map(renderLink)}</ul>
            </div>
          ) : null}
        </nav>
        <div className="p-3 border-t border-white/10 flex items-center gap-2">
          <div className="w-11 h-11 rounded-lg bg-white/10 inline-flex items-center justify-center text-sm font-bold">{initial}</div>
          <p className="text-sm font-bold truncate flex-1">{name}</p>
          <button type="button" onClick={signOut} className="min-h-11 min-w-11 inline-flex items-center justify-center sidebar-quiet" aria-label="Sign out" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
