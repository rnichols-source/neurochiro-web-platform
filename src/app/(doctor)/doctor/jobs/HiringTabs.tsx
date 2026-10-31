'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/doctor/jobs', label: 'My job posts', active: (path: string) => path.startsWith('/doctor/jobs') },
  { href: '/doctor/students', label: 'Browse students', active: (path: string) => path === '/doctor/students' },
  { href: '/doctor/students/shadow', label: 'Shadow days', active: (path: string) => path.startsWith('/doctor/students/shadow') },
  { href: '/doctor/chiromatch', label: 'ChiroMatch', active: (path: string) => path.startsWith('/doctor/chiromatch') },
] as const;

export default function HiringTabs() {
  const pathname = usePathname() || '';

  return (
    <nav aria-label="Hiring" className="flex flex-wrap gap-2 mb-6">
      {TABS.map((tab) => {
        const current = tab.active(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={current ? 'page' : undefined}
            className={`min-h-11 inline-flex items-center px-4 rounded-lg text-sm font-bold ${
              current ? 'bg-portal-accent text-white' : 'bg-white border border-portal-border text-portal-ink'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
