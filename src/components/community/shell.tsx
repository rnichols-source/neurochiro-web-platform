'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AREA_LIST, AREAS, type AreaId } from '@/components/community/areas'
import { AreaIcon, SignOutIcon } from '@/components/community/icons'
import { communityNavId, memberInitial } from '@/lib/community/logic'
import { createClient } from '@/lib/supabase'
import '@/styles/community.css'

export function CommunityNav({ active }: { active: AreaId }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3e0da] bg-white px-1.5 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(21,32,43,0.06)] lg:hidden"
      aria-label="Your NeuroChiro"
    >
      <div className="mx-auto flex max-w-[720px]">
        {AREA_LIST.map((item) => {
          const on = active === item.id
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={on ? 'page' : undefined}
              className="relative flex min-h-11 min-w-0 flex-1 flex-col items-center gap-[3px] pt-1"
              style={{ color: on ? item.ink : '#5b6773' }}
            >
              {on ? <span className="absolute -top-2 h-1 w-[34px] rounded-b" style={{ background: item.color }} /> : null}
              <span
                className="grid h-8 w-[58px] place-items-center rounded-2xl"
                style={on ? { background: item.tint, color: item.ink } : undefined}
              >
                <AreaIcon id={item.id} size={23} strokeWidth={on ? 2.1 : 1.8} />
              </span>
              <span className={`nc-ui whitespace-nowrap text-[11px] tracking-[-0.01em] ${on ? 'font-extrabold' : 'font-semibold'}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function Sidebar({ active, name, initial, onSignOut }: { active: AreaId; name: string; initial: string; onSignOut: () => void }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-[#ECE8E1] bg-white px-4 py-6 lg:flex">
      <Link href="/portal" className="mb-[22px] flex items-center gap-2.5 px-2">
        <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-[#F5F3EF]">
          <img src="/logo.png" alt="" className="h-[30px] w-[30px] object-contain" />
        </span>
        <span className="nc-ui text-[14px] font-black tracking-[0.1em] text-[#15202B]">NEUROCHIRO</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1.5" aria-label="Your NeuroChiro">
        {AREA_LIST.map((item) => {
          const on = active === item.id
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={on ? 'page' : undefined}
              className="relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 nc-ui text-[16px]"
              style={on
                ? { background: item.tint, color: item.ink, fontWeight: 800 }
                : { color: '#3d4a57', fontWeight: 700 }}
            >
              {on ? <span className="absolute -left-4 top-2.5 bottom-2.5 w-[5px] rounded-r" style={{ background: item.color }} /> : null}
              <span
                className="grid h-[38px] w-[38px] place-items-center rounded-xl"
                style={on ? { background: item.color, color: '#fff' } : { background: item.tint, color: item.ink }}
              >
                <AreaIcon id={item.id} size={20} />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-4 flex items-center gap-2.5 border-t border-[#EFECE7] px-3 pt-3">
        <Link href="/portal/me" aria-label="Me" className="grid h-11 w-11 place-items-center rounded-full bg-[#D66829] nc-ui text-[16px] font-extrabold text-white">
          {initial}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="nc-ui text-[13px] font-extrabold leading-tight text-[#15202B]">{name}</p>
          <p className="text-[12px] text-[#5b6773]">Community member</p>
        </div>
        <button type="button" onClick={onSignOut} className="inline-flex min-h-11 min-w-11 items-center justify-center text-[#5b6773]" aria-label="Sign out">
          <SignOutIcon />
        </button>
      </div>
    </aside>
  )
}

export default function CommunityShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const active = communityNavId(pathname)
  const [name, setName] = useState('Community member')
  const [initial, setInitial] = useState('Y')

  useEffect(() => {
    if (loading) return
    if (!user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle().then(({ data }) => {
      const full = data?.full_name || ''
      if (full.trim()) {
        setName(full.trim())
        setInitial(memberInitial(full))
      }
    })
  }, [user?.id])

  function signOut() {
    const supabase = createClient()
    supabase.auth.signOut().then(() => {
      window.location.href = '/login'
    })
  }

  return (
    <div className="community min-h-dvh bg-[#F5F3EF] text-[#15202B] lg:flex">
      <Sidebar active={active} name={name} initial={initial} onSignOut={signOut} />
      <div className="min-w-0 flex-1">
        <main className="px-[18px] pb-28 lg:px-10 lg:pb-12">{children}</main>
      </div>
      <CommunityNav active={active} />
    </div>
  )
}

export { AREAS }
