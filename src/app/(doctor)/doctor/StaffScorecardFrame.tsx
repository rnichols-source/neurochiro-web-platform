'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const LINKS = [
  { href: '/doctor/people', label: 'People' },
  { href: '/doctor/kpi', label: 'Scorecard' },
]

export default function StaffScorecardFrame({ children, clinic }: { children: React.ReactNode; clinic: string | null }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const allowed = pathname === '/doctor/kpi' || pathname.startsWith('/doctor/kpi/') || pathname === '/doctor/people' || pathname.startsWith('/doctor/people/')

  useEffect(() => {
    if (!allowed) router.replace('/doctor/people')
  }, [allowed, router])

  function signOut() {
    const supabase = createClient()
    supabase.auth.signOut().then(() => {
      window.location.href = '/'
    })
  }

  if (!allowed) {
    return <p className="p-6 text-sm font-bold text-portal-ink">Opening People…</p>
  }

  const place = clinic || "your doctor's office"
  return (
    <div className="min-h-dvh bg-[#F5F3EF]">
      <header className="border-b border-[#E7E2D8] bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] font-extrabold text-[#15202B]">Office desk</p>
            <p className="mt-1 max-w-xl text-[14px] leading-snug text-[#5b6773]">You are signed in for {place}. You can see phone numbers and email, call or text, and move the stage. Sending a home plan stays on the doctor login.</p>
          </div>
          <button type="button" onClick={signOut} className="min-h-11 shrink-0 px-3 text-[14px] font-bold text-[#15202B]">Sign out</button>
        </div>
        <nav className="mt-3 flex gap-2" aria-label="Office desk">
          {LINKS.map((link) => {
            const on = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link key={link.href} href={link.href} aria-current={on ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-xl px-4 text-[14px] font-extrabold ${on ? 'bg-[#1E2D3B] text-white' : 'bg-[#F5F3EF] text-[#15202B]'}`}>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
