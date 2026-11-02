'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, Search, X } from 'lucide-react'
import PerspectiveBanner from '@/components/admin/PerspectiveBanner'
import NotificationBell from '@/components/layout/NotificationBell'
import { AuthProvider } from '@/context/AuthContext'
import { isNearbyPlace, parseLocationQuery } from '@/lib/admin/location-query'
import { MemberPalette } from './member-palette'

function memberSearchPath(q: string): string {
  const params = new URLSearchParams()
  params.set('q', q)
  if (isNearbyPlace(parseLocationQuery(q))) params.set('near', '100')
  return `/admin/members?${params.toString()}`
}
import Sidebar from './Sidebar'
import { logoutAdmin } from './SidebarActions'
import { moreNav, navIsActive, primaryNav } from './nav'

const mobileTabs = primaryNav.filter((item) => ['Today', 'Members', 'Coverage', 'Leads'].includes(item.name))

export function AdminShell({
  children,
  role,
  name,
  leadAttention,
}: {
  children: React.ReactNode
  role: string
  name: string
  leadAttention: number | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const roleLabel = role ? role.replaceAll('_', ' ') : 'Staff'

  async function signOut() {
    await logoutAdmin()
    document.cookie = 'nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
    router.refresh()
  }

  return (
    <AuthProvider>
      <div className="flex h-dvh flex-col bg-neuro-cream text-neuro-navy">
        <PerspectiveBanner />
        <div className="flex min-h-0 flex-1">
          <Sidebar leadAttention={leadAttention} />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-white px-3 md:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl md:hidden"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <MemberPalette />
                <form
                  className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/10 bg-neuro-cream px-3 md:flex md:max-w-md"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const q = query.trim()
                    if (q) router.push(memberSearchPath(q))
                  }}
                >
                  <Search className="h-4 w-4 shrink-0 text-neuro-gray" />
                  <input
                    id="admin-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search members"
                    className="min-h-11 w-full bg-transparent text-sm text-neuro-navy outline-none"
                  />
                  <span className="hidden text-xs text-neuro-gray lg:inline">⌘K</span>
                </form>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell viewAllHref="/admin/notifications" />
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-neuro-navy">{name}</p>
                  <p className="text-xs capitalize text-neuro-gray">{roleLabel}</p>
                </div>
                <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl" onClick={signOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </header>
            <main className="admin-canvas min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-neuro-navy md:hidden">
          {mobileTabs.map((item) => {
            const active = navIsActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={`flex min-h-11 flex-col items-center justify-center text-[11px] ${active ? 'text-neuro-orange-light' : 'text-white/80'}`}>
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          <button type="button" className="flex min-h-11 flex-col items-center justify-center text-[11px] text-white/80" onClick={() => setMoreOpen(true)}>
            More
          </button>
        </nav>
        {moreOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" className="absolute inset-0 bg-neuro-navy/40" aria-label="Close menu" onClick={() => setMoreOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-heading text-base font-bold">More</p>
                <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center" onClick={() => setMoreOpen(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {[...primaryNav.filter((item) => !mobileTabs.some((tab) => tab.href === item.href)), ...moreNav].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className="flex min-h-11 items-center text-sm text-neuro-navy">
                  {item.name}
                  {item.badge === 'leads' && leadAttention ? ` (${leadAttention})` : ''}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {menuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" className="absolute inset-0 bg-neuro-navy/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-neuro-navy p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs capitalize text-white/70">{roleLabel}</p>
                </div>
                <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center" onClick={() => setMenuOpen(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                className="mb-3 flex items-center gap-2 rounded-xl bg-white/10 px-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  const q = query.trim()
                  if (!q) return
                  setMenuOpen(false)
                  router.push(memberSearchPath(q))
                }}
              >
                <Search className="h-4 w-4" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="min-h-11 w-full bg-transparent text-sm outline-none" />
              </form>
              {[...primaryNav, ...moreNav].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center text-sm text-white">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AuthProvider>
  )
}
