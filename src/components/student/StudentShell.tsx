'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Home, Menu, MessageSquare, Shuffle } from 'lucide-react';
import NotificationBell from '@/components/layout/NotificationBell';
import Sidebar from '@/app/(student)/student/Sidebar';
import { studentGreetingName } from '@/lib/students/greeting';
import { useStudentPortal } from '@/components/student/StudentPortalProvider';

const MOBILE = [
  { name: 'Home', href: '/student/dashboard', icon: Home },
  { name: 'Jobs', href: '/student/jobs', icon: Briefcase },
  { name: 'Messages', href: '/student/messages', icon: MessageSquare },
  { name: 'Match', href: '/student/match', icon: Shuffle },
];

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const portal = useStudentPortal();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const initial = studentGreetingName(portal.fullName).slice(0, 1).toUpperCase();

  return (
    <div className="flex h-dvh bg-portal-canvas overflow-hidden">
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-portal-border flex items-center justify-between px-4 md:px-8 shrink-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center text-portal-ink"
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/student/profile" className="hidden md:inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-portal-surface text-sm font-bold text-portal-ink" aria-label="Profile" title="Profile">
              {initial}
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[130] bg-portal-sidebar text-white border-t border-[#e3e8ed]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Student">
        <div className="grid grid-cols-5 h-16">
          {MOBILE.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`min-h-11 flex flex-col items-center justify-center gap-0.5 text-xs font-bold ${active ? 'text-portal-accent' : 'text-portal-ink'}`}>
                <Icon className="w-5 h-5" />
                <span>{item.name}{item.name === 'Messages' && portal.unreadMessages > 0 ? ` (${portal.unreadMessages})` : ''}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className="min-h-11 flex flex-col items-center justify-center gap-0.5 text-xs font-bold text-portal-ink" aria-label="Open menu" title="Open menu">
            <Menu className="w-5 h-5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
