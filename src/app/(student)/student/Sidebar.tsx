'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { visibleStudentFeatures, type StudentFeature } from '@/config/student-features';
import { useStudentPortal } from '@/components/student/StudentPortalProvider';

const GROUPS: { key: StudentFeature['group']; label: string | null }[] = [
  { key: 'main', label: null },
  { key: 'place', label: 'Find your place' },
  { key: 'ready', label: 'Get ready' },
  { key: 'protect', label: 'Protect yourself' },
  { key: 'seminars', label: 'Seminars' },
  { key: 'account', label: 'Account' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname() || '';
  const portal = useStudentPortal();
  const member = portal.membership.status === 'member' || portal.membership.status === 'grace' || portal.membership.status === 'past_due';
  const features = visibleStudentFeatures().filter((feature) => feature.state === 'live' || feature.state === 'beta' || feature.state === 'coming_soon');

  return (
    <>
      {isOpen ? <button type="button" className="fixed inset-0 z-[140] bg-black/40 md:hidden" aria-label="Close menu" title="Close menu" onClick={onClose} /> : null}
      <aside className={`portal-sidebar fixed md:static z-[160] inset-y-0 left-0 w-72 shrink-0 bg-portal-sidebar text-white flex flex-col transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#e3e8ed]">
          <Link href="/student/dashboard" className="text-base font-bold text-portal-ink" onClick={onClose}>NeuroChiro</Link>
          <button type="button" className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center" aria-label="Close menu" title="Close menu" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav aria-label="Student" className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {GROUPS.map((group) => {
            const items = features.filter((feature) => feature.group === group.key && feature.key !== 'ce_tracker');
            if (!items.length) return null;
            return (
              <div key={group.key}>
                {group.label ? <p className="px-3 mb-1 text-xs font-bold text-portal-ink-2">{group.label}</p> : null}
                <ul className="space-y-1">
                  {items.map((feature) => {
                    const active = pathname === feature.href || pathname.startsWith(`${feature.href}/`);
                    const locked = feature.requires === 'member' && !member;
                    return (
                      <li key={feature.key}>
                        <Link
                          href={feature.href}
                          onClick={onClose}
                          className={`min-h-11 flex items-center justify-between gap-2 rounded-lg px-3 text-sm font-bold ${active ? 'bg-portal-sidebar-active text-white' : 'text-white/90'}`}
                        >
                          <span>{feature.label}</span>
                          {feature.state === 'coming_soon' ? <span className="text-xs font-bold text-portal-ink-2">Soon</span> : null}
                          {locked ? <span className="text-xs font-bold text-portal-ink-2">Members</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
