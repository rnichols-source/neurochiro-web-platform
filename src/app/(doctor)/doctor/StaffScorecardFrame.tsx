'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function StaffScorecardFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const allowed = pathname === '/doctor/kpi' || pathname.startsWith('/doctor/kpi/')

  useEffect(() => {
    if (!allowed) router.replace('/doctor/kpi')
  }, [allowed, router])

  function signOut() {
    const supabase = createClient()
    supabase.auth.signOut().then(() => {
      window.location.href = '/'
    })
  }

  if (!allowed) {
    return <p className="p-6 text-sm font-bold text-portal-ink">Opening the scorecard…</p>
  }

  return (
    <div className="min-h-dvh bg-portal-canvas">
      <header className="flex items-center justify-between gap-3 border-b border-portal-border bg-white px-4 py-3">
        <p className="font-bold text-portal-ink">Office scorecard</p>
        <button type="button" onClick={signOut} className="min-h-11 px-3 text-sm font-bold text-portal-ink">Sign out</button>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
