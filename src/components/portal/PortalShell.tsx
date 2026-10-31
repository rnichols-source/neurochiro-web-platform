'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import { LayoutDashboard, Inbox, MessageSquare, User, Menu, Lock, LogOut } from 'lucide-react';
import NotificationBell from '@/components/layout/NotificationBell';
import { usePortal } from '@/components/portal/PortalProvider';
import { ReferButton } from '@/components/portal/ReferralProvider';
import { createClient } from '@/lib/supabase';
import type { PortalNavItem } from '@/lib/portal/features';

const MOBILE_NAV_H = 56;
const GROUPS = ['main', 'grow', 'tools', 'account'] as const;
const GROUP_LABEL: Record<string, string | null> = {
  main: null,
  grow: 'Grow',
  tools: 'Tools',
  account: 'Account',
};

function badgeText(count?: number) {
  if (!count || count < 1) return null;
  return count > 99 ? '99+' : String(count);
}

function NavIcon({ name }: { name: string }) {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] || Icons.Circle;
  return <Cmp className="w-4 h-4 shrink-0" aria-hidden />;
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const ctx = usePortal();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState<PortalNavItem | null>(null);

  const referral = ctx.nav.find((item) => item.key === 'referrals');
  const fullHeight = (pathname || '').startsWith('/doctor/messages');

  function signOut() {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      window.location.href = '/';
    });
  }

  function itemActive(href: string) {
    return pathname === href || (href !== '/doctor/dashboard' && pathname.startsWith(href));
  }

  const sidebar = (
    <div className="portal-sidebar flex flex-col h-full bg-portal-sidebar text-white" data-portal-notifications={ctx.unreadNotifications}>
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-bold">NeuroChiro</p>
        <p className="text-xs text-white/70 truncate">{ctx.fullName || 'Doctor'}</p>
      </div>
      {referral?.locked ? (
        <button type="button" onClick={() => setLocked(referral)} className="mx-3 mb-3 min-h-11 rounded-lg bg-portal-accent text-white text-sm font-bold">
          Refer a patient
        </button>
      ) : referral ? (
        <ReferButton className="mx-3 mb-3 min-h-11 rounded-lg bg-portal-accent text-white text-sm font-bold inline-flex items-center justify-center" />
      ) : null}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {GROUPS.map((group) => {
          const items = ctx.nav.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-3">
              {GROUP_LABEL[group] ? <p className="px-3 pt-2 pb-1 text-xs text-white/60">{GROUP_LABEL[group]}</p> : null}
              {items.map((item) => {
                const active = itemActive(item.href);
                const badge = badgeText(item.badge);
                const className = `w-full min-h-11 px-3 py-2 rounded-lg flex items-center gap-3 text-left ${active ? 'bg-portal-sidebar-active text-white' : 'text-white/80 hover:bg-portal-sidebar-active'}`;
                const body = (
                  <>
                    <NavIcon name={item.icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold leading-5">{item.label}</span>
                      {item.subtitle ? <span className="block text-xs text-white/60 leading-4">{item.subtitle}</span> : null}
                    </span>
                    {item.locked ? <span className="text-xs text-white/80 inline-flex items-center gap-1"><Lock className="w-3 h-3" aria-hidden /> Pro</span> : null}
                    {badge ? <span className="min-w-5 h-5 px-1 rounded-full bg-portal-accent text-white text-xs font-bold inline-flex items-center justify-center" {...(item.key === 'messages' ? { 'data-messages-badge': item.badge || 0 } : {})}>{badge}</span> : null}
                  </>
                );
                if (item.locked) {
                  return (
                    <button key={item.key} type="button" className={className} title={item.subtitle} onClick={() => { setLocked(item); setOpen(false); }}>
                      {body}
                    </button>
                  );
                }
                return (
                  <Link key={item.key} href={item.href} className={className} title={item.subtitle} onClick={() => setOpen(false)}>
                    {body}
                  </Link>
                );
              })}
            </div>
          );
        })}
        <Link href="/doctor/coming-soon" className="min-h-11 px-3 rounded-lg flex items-center text-sm text-white/80 hover:bg-portal-sidebar-active" onClick={() => setOpen(false)}>
          Coming soon ({ctx.comingSoonCount})
        </Link>
      </nav>
      <div className="p-3 border-t border-white/10 flex items-center gap-2">
        <div className="w-11 h-11 rounded-lg bg-portal-sidebar-active inline-flex items-center justify-center text-sm font-bold">{ctx.initials}</div>
        <p className="text-sm font-bold truncate flex-1">{ctx.doctor?.clinic_name || 'Your practice'}</p>
        <button type="button" onClick={signOut} className="min-h-11 min-w-11 inline-flex items-center justify-center text-white/80" aria-label="Sign out" title="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const mobile = [
    { name: 'Home', href: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'Requests', href: '/doctor/leads', icon: Inbox },
    { name: 'Messages', href: '/doctor/messages', icon: MessageSquare, badge: ctx.unreadMessages },
    { name: 'Profile', href: '/doctor/profile', icon: User },
  ];

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-portal-canvas overflow-hidden text-portal-ink">
      <aside className="hidden md:flex w-72 shrink-0 h-dvh">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-[200] md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" title="Close menu" onClick={() => setOpen(false)} />
          <div className="relative w-72 h-full shadow-lg">{sidebar}</div>
        </div>
      ) : null}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-portal-border flex items-center justify-between px-4 shrink-0">
          <button type="button" onClick={() => setOpen(true)} className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center" aria-label="Open menu" title="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="hidden md:block" />
          <div className="flex items-center gap-1">
            <NotificationBell unreadOverride={ctx.unreadNotifications} includeAnnouncements={false} variant="light" />
            <Link href="/doctor/profile" className="hidden md:inline-flex w-11 h-11 rounded-lg bg-portal-surface items-center justify-center text-sm font-bold" aria-label="My profile" title="My profile">
              {ctx.initials}
            </Link>
          </div>
        </header>
        <main
          className={fullHeight
            ? 'flex-1 min-h-0 flex flex-col overflow-hidden bg-portal-canvas md:!pb-0'
            : 'flex-1 overflow-y-auto bg-portal-canvas pb-24 md:pb-0'}
          style={fullHeight ? { paddingBottom: `calc(${MOBILE_NAV_H}px + env(safe-area-inset-bottom, 0px))` } : undefined}
        >
          {ctx.membership.tier === 'free' ? (
            <div className="shrink-0 bg-portal-accent-50 border-b border-portal-border px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-portal-ink">Activate Pro to unlock patient requests and results.</p>
              <Link href="/doctor/billing" className="min-h-11 px-4 inline-flex items-center bg-portal-accent text-white text-sm font-bold rounded-lg">Activate Pro</Link>
            </div>
          ) : null}
          <div className={fullHeight ? 'flex-1 min-h-0 flex flex-col p-0 md:p-6 max-w-6xl mx-auto w-full' : 'p-4 md:p-8 max-w-6xl mx-auto w-full'}>{children}</div>
        </main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[150] bg-portal-sidebar border-t border-white/10 flex" style={{ height: `calc(${MOBILE_NAV_H}px + env(safe-area-inset-bottom, 0px))`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {mobile.map((item) => {
          const active = itemActive(item.href);
          const badge = badgeText(item.badge);
          return (
            <Link key={item.name} href={item.href} className={`flex-1 min-h-11 py-2 flex flex-col items-center justify-center text-xs ${active ? 'text-portal-accent' : 'text-white/70'}`}>
              <span className="relative">
                <item.icon className="w-5 h-5" aria-hidden />
                {badge ? <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-portal-accent text-white text-xs font-bold inline-flex items-center justify-center" {...(item.name === 'Messages' ? { 'data-messages-badge': item.badge || 0 } : {})}>{badge}</span> : null}
              </span>
              {item.name}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="flex-1 min-h-11 py-2 flex flex-col items-center justify-center text-xs text-white/70" aria-label="Open menu" title="Open menu">
          <Menu className="w-5 h-5" />
          Menu
        </button>
      </nav>
      {locked ? (
        <div className="fixed inset-0 z-[300] bg-black/40 flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="locked-title">
          <div className="bg-white rounded-xl border border-portal-border shadow-lg p-6 w-full max-w-sm">
            <h2 id="locked-title" className="text-lg font-bold text-portal-ink">{locked.label}</h2>
            <p className="mt-2 text-sm text-portal-ink-2">This is part of Pro. Activate Pro to open {locked.label.toLowerCase()}.</p>
            <div className="mt-4 flex gap-2">
              <Link href="/doctor/billing" className="min-h-11 px-4 inline-flex items-center rounded-lg bg-portal-accent text-white text-sm font-bold" onClick={() => setLocked(null)}>Upgrade</Link>
              <button type="button" className="min-h-11 px-4 rounded-lg border border-portal-border text-sm font-bold" onClick={() => setLocked(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
