'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/layout/NotificationBell';
import { useStudentPortal } from '@/components/student/StudentPortalProvider';
import { StudentPlaceIcon, StudentSignOutIcon } from '@/components/student/icons';
import { studentGreetingName } from '@/lib/students/greeting';
import { hasMemberAccess } from '@/lib/students/membership-pure';
import {
  STUDENT_PLACE_LIST,
  STUDENT_PLACES,
  STUDENT_TOOL_GROUPS,
  STUDENT_TOOL_LINKS,
  studentNavId,
  type StudentPlaceId,
} from '@/lib/students/places';

const FALLBACK_TONE = STUDENT_PLACES.me;
import { createClient } from '@/lib/supabase';
import '@/styles/doctor-portal.css';

function NavLink({
  href,
  label,
  on,
  tone,
  icon,
  badge,
}: {
  href: string;
  label: string;
  on: boolean;
  tone: { color: string; ink: string; tint: string };
  icon?: ReactNode;
  badge?: string | null;
}) {
  return (
    <Link
      prefetch
      href={href}
      aria-current={on ? 'page' : undefined}
      className="relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 dp-ui text-[16px]"
      style={on ? { background: tone.tint, color: tone.ink, fontWeight: 800 } : { color: '#3d4a57', fontWeight: 700 }}
    >
      {on ? <span className="absolute -left-4 bottom-2.5 top-2.5 w-[5px] rounded-r" style={{ background: tone.color }} /> : null}
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="dp-ui grid h-6 min-w-6 place-items-center rounded-full bg-[#D66829] px-1.5 text-[12px] font-extrabold text-white">{badge}</span>
      ) : null}
    </Link>
  );
}

export default function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/student/dashboard';
  const portal = useStudentPortal();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const open = menuFor === pathname;
  const nav = studentNavId(pathname);
  const member = hasMemberAccess(portal.membership);
  const initial = studentGreetingName(portal.fullName).slice(0, 1).toUpperCase() || 'S';
  const messageBadge = portal.unreadMessages > 0 ? (portal.unreadMessages > 99 ? '99+' : String(portal.unreadMessages)) : null;
  const placeLine = [portal.school, portal.city && portal.state ? `${portal.city}, ${portal.state}` : portal.city].filter(Boolean).join(' · ');

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuFor(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function signOut() {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      window.location.href = '/';
    });
  }

  const sidebar = (
    <nav className="flex min-h-0 flex-1 flex-col" aria-label="Student portal">
      <div className="flex shrink-0 flex-col gap-1.5">
        {STUDENT_PLACE_LIST.map((item) => {
          const on = nav === item.id;
          return (
            <NavLink
              key={item.id}
              href={item.href}
              label={item.label}
              on={on}
              tone={item}
              icon={(
                <span
                  className="grid h-[38px] w-[38px] place-items-center rounded-xl"
                  style={on ? { background: item.color, color: '#fff' } : { background: item.tint, color: item.ink }}
                >
                  <StudentPlaceIcon id={item.id as StudentPlaceId} />
                </span>
              )}
            />
          );
        })}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-[#EFECE7] pt-3">
        <p className="px-3 pb-2 dp-ui text-[11px] font-extrabold tracking-[0.12em] text-[#8a95a1]">YOUR TOOLS</p>
        {STUDENT_TOOL_GROUPS.map((group) => {
          const tone = STUDENT_PLACE_LIST.find((place) => place.id === group.place) || FALLBACK_TONE;
          const links = STUDENT_TOOL_LINKS.filter((link) => link.group === group.id);
          return (
            <div key={group.id} className="mb-3">
              <p className="px-3 pb-1 dp-ui text-[11px] font-extrabold tracking-[0.08em]" style={{ color: tone.ink }}>{group.label}</p>
              {links.map((link) => {
                const on = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    prefetch
                    key={link.href}
                    href={link.href}
                    aria-current={on ? 'page' : undefined}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 dp-ui text-[14px] font-bold"
                    style={on ? { background: tone.tint, color: tone.ink } : { color: '#3d4a57' }}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tone.color }} />
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                    {link.href === '/student/messages' && messageBadge ? (
                      <span className="dp-ui grid h-6 min-w-6 place-items-center rounded-full bg-[#D66829] px-1.5 text-[12px] font-extrabold text-white">{messageBadge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2.5 border-t border-[#EFECE7] px-1 pt-3">
        <Link prefetch href="/student/profile" aria-label="Profile" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#D66829] dp-ui text-[14px] font-extrabold text-white">
          {initial}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="dp-ui truncate text-[13px] font-extrabold leading-tight text-[#15202B]">{portal.fullName || 'Student'}</p>
          <p className="truncate text-[12px] text-[#5b6773]">{placeLine || 'Add your school and city'}</p>
        </div>
        <button type="button" onClick={signOut} className="inline-flex min-h-11 min-w-11 items-center justify-center text-[#5b6773]" aria-label="Sign out">
          <StudentSignOutIcon />
        </button>
      </div>
    </nav>
  );

  return (
    <div className="doctor-portal flex h-dvh min-h-0 bg-[#F5F3EF] text-[#15202B]">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-[#ECE8E1] bg-white px-4 py-6 lg:flex">
        <Link prefetch href="/student/dashboard" className="mb-3 flex items-center gap-2.5 px-2">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-[#F5F3EF]">
            <Image src="/logo-mark.png" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
          </span>
          <span className="min-w-0">
            <span className="dp-ui block text-[14px] font-extrabold tracking-[0.08em] text-[#15202B]">NEUROCHIRO</span>
            <span className="dp-ui block text-[11px] font-extrabold tracking-[0.12em] text-[#8a95a1]">STUDENT PORTAL</span>
          </span>
        </Link>
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[#15202B]/40" aria-label="Close menu" onClick={() => setMenuFor(null)} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col overflow-hidden bg-white px-4 py-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="dp-ui text-[14px] font-extrabold tracking-[0.08em]">NEUROCHIRO</p>
              <button type="button" className="min-h-11 min-w-11 dp-ui text-[14px] font-bold" onClick={() => setMenuFor(null)}>Close</button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E7E2D8] bg-white px-4 py-2 lg:hidden">
          <button type="button" className="min-h-11 dp-ui text-[14px] font-extrabold text-[#15202B]" aria-expanded={open} onClick={() => setMenuFor(pathname)}>
            Menu
          </button>
          <NotificationBell viewAllHref="/student/notifications" />
        </div>
        {!member && !pathname.startsWith('/student/subscribe') && !pathname.startsWith('/student/billing') ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E7E2D8] bg-[#FCEBDF] px-4 py-3">
            <p className="text-[14px] text-[#15202B]">Membership opens the monthly call, ChiroMatch, and contracts.</p>
            <Link prefetch href="/student/subscribe" className="dp-ui inline-flex min-h-11 shrink-0 items-center rounded-xl bg-[#D66829] px-4 text-[14px] font-extrabold text-white">See pricing</Link>
          </div>
        ) : null}
        <div className="hidden shrink-0 items-center justify-end border-b border-[#EFECE7] bg-[#F5F3EF] px-10 py-2 lg:flex">
          <NotificationBell viewAllHref="/student/notifications" />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-28 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3e0da] bg-white px-1.5 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(21,32,43,0.06)] lg:hidden"
        aria-label="Student portal"
      >
        <div className="mx-auto flex max-w-[720px]">
          {STUDENT_PLACE_LIST.map((item) => {
            const on = nav === item.id;
            return (
              <Link
                prefetch
                key={item.id}
                href={item.href}
                aria-current={on ? 'page' : undefined}
                className="relative flex min-h-11 min-w-0 flex-1 flex-col items-center gap-[3px] pt-1"
                style={{ color: on ? item.ink : '#5b6773' }}
              >
                {on ? <span className="absolute -top-2 h-1 w-[34px] rounded-b" style={{ background: item.color }} /> : null}
                <span className="grid h-8 w-[58px] place-items-center rounded-2xl" style={on ? { background: item.tint, color: item.ink } : undefined}>
                  <StudentPlaceIcon id={item.id} size={22} strokeWidth={on ? 2.1 : 1.8} />
                </span>
                <span className={`dp-ui whitespace-nowrap text-[11px] tracking-[-0.01em] ${on ? 'font-extrabold' : 'font-semibold'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
