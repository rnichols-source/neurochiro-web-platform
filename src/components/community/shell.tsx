'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { communityNavId } from '@/lib/community/logic'

const ITEMS = [
  { id: 'home', href: '/portal', label: 'Home' },
  { id: 'care', href: '/portal/care', label: 'Care' },
  { id: 'week', href: '/portal/week', label: 'This week' },
  { id: 'work', href: '/portal/work', label: 'Work' },
  { id: 'you', href: '/portal/you', label: 'You' },
] as const

function Icon({ id }: { id: string }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true as const }
  if (id === 'home') {
    return <svg {...common} strokeLinejoin="round"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" /></svg>
  }
  if (id === 'care') {
    return <svg {...common} strokeLinecap="round"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>
  }
  if (id === 'week') {
    return <svg {...common} strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
  }
  if (id === 'work') {
    return <svg {...common} strokeLinejoin="round"><path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" /><rect x="4" y="7" width="16" height="13" rx="2" /></svg>
  }
  return <svg {...common}><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8" /></svg>
}

export function CommunityNav() {
  const pathname = usePathname()
  const active = communityNavId(pathname)
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[480px] -translate-x-1/2 items-end justify-around border-t border-[#d9dfe5] bg-white px-1.5 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 md:max-w-[640px] lg:max-w-[720px]"
      aria-label="Your NeuroChiro"
    >
      {ITEMS.map((item) => {
        const on = active === item.id
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={on ? 'page' : undefined}
            className={`flex w-16 flex-col items-center gap-[3px] text-[10px] font-semibold ${on ? 'text-neuro-navy' : 'text-[#6b7785]'}`}
          >
            <Icon id={item.id} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function CommunityShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) router.push('/login')
  }, [user, loading, router])

  return (
    <div
      className="min-h-dvh bg-[#F5F3EF] text-[#16202a]"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col md:max-w-[640px] lg:max-w-[720px]">
        <main className="flex-1 px-[18px] pb-28 pt-3">{children}</main>
      </div>
      <CommunityNav />
    </div>
  )
}
