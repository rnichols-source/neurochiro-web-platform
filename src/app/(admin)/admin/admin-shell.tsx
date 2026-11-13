'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { Activity, Bell, Megaphone, Menu, Search, TrendingUp, Users, Wallet, X } from 'lucide-react'
import PerspectiveBanner from '@/components/admin/PerspectiveBanner'
import { MORE, PLACES, placeById, placeForPath, type PlaceId } from '@/lib/founder/places'
import { AuthProvider } from '@/context/AuthContext'
import { logoutAdmin } from './SidebarActions'
import '@/styles/founder.css'

export type ShellAlert = { id: string; title: string; href: string }

const ShellContext = createContext<{ alerts: ShellAlert[]; openMenu: () => void; name: string }>({
  alerts: [],
  openMenu: () => {},
  name: 'Admin',
})

export function useFounderShell() {
  return useContext(ShellContext)
}

const ICONS = {
  pulse: Activity,
  growth: TrendingUp,
  people: Users,
  money: Wallet,
  broadcast: Megaphone,
} as const

function ownsHeader(pathname: string): boolean {
  if (pathname === '/admin' || pathname === '/admin/money' || pathname === '/admin/broadcast') return true
  if (pathname === '/admin/card' || pathname === '/admin/audit' || pathname === '/admin/health' || pathname === '/admin/settings' || pathname === '/admin/work') return true
  return pathname.startsWith('/admin/growth') || pathname.startsWith('/admin/people')
}

export function AdminShell({
  children,
  role,
  name,
  alerts,
}: {
  children: React.ReactNode
  role: string
  name: string
  alerts: ShellAlert[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const placeId = placeForPath(pathname)
  const active: PlaceId = placeId === 'more' ? 'pulse' : placeId
  const initial = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'A'

  async function signOut() {
    await logoutAdmin()
    document.cookie = 'nc_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
    router.refresh()
  }

  const sidebar = (
    <aside className="flex h-full w-[250px] flex-col bg-white px-3 py-5">
      <Link href="/admin" className="mb-4 flex items-center gap-2.5 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5F3EF]">
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
        </span>
        <span>
          <span className="fd-ui block text-[13px] font-black tracking-[0.12em] text-[#15202B]">NEUROCHIRO</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a95a1]">Founder admin</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-1" aria-label="Founder admin">
        {PLACES.map((place) => {
          const on = placeForPath(pathname) === place.id
          const Icon = ICONS[place.id]
          return (
            <Link
              key={place.id}
              href={place.href}
              aria-current={on ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
              className="relative flex min-h-11 items-center gap-3 rounded-[14px] px-2 fd-ui text-[15px]"
              style={on ? { background: place.tint, color: place.ink, fontWeight: 800 } : { color: '#3d4a57', fontWeight: 700 }}
            >
              {on ? <span className="absolute -left-3 top-2.5 bottom-2.5 w-[5px] rounded-r" style={{ background: place.color }} /> : null}
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={on ? { background: place.color, color: '#fff' } : { background: place.tint, color: place.ink }}>
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="flex-1">{place.label}</span>
              {place.id === 'pulse' && alerts.length ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#D66829] px-1 text-[11px] font-extrabold text-white">{alerts.length}</span>
              ) : null}
            </Link>
          )
        })}
      </nav>
      <p className="fd-ui mb-1 mt-5 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8a95a1]">More</p>
      <div className="flex flex-col">
        {MORE.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`flex min-h-11 items-center rounded-xl px-3 text-[14px] font-bold ${pathname === item.href ? 'bg-[#F5F3EF] text-[#15202B]' : 'text-[#5b6773]'}`}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-[#EFECE7] px-2 pt-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#D66829] fd-ui text-[14px] font-extrabold text-white">{initial}</span>
        <span className="min-w-0 flex-1">
          <span className="fd-ui block truncate text-[13px] font-extrabold">{name}</span>
          <span className="block text-[12px] capitalize text-[#5b6773]">{role.replaceAll('_', ' ') || 'Founder'}</span>
        </span>
        <button type="button" onClick={signOut} className="min-h-11 px-2 text-[12px] font-bold text-[#5b6773]">Sign out</button>
      </div>
    </aside>
  )

  return (
    <AuthProvider>
      <ShellContext.Provider value={{ alerts, openMenu: () => setMenuOpen(true), name }}>
        <div className="founder flex h-dvh flex-col bg-[#F5F3EF] text-[#15202B]">
          <PerspectiveBanner />
          <div className="flex min-h-0 flex-1">
            <div className="hidden shrink-0 border-r border-[#ECE8E1] lg:block">{sidebar}</div>
            <div className="flex min-w-0 flex-1 flex-col">
              {ownsHeader(pathname) ? null : <LegacyBand pathname={pathname} />}
              <main className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-6">{children}</main>
            </div>
          </div>
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3e0da] bg-white px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(21,32,43,0.06)] lg:hidden" aria-label="Founder admin">
            <div className="flex">
              {PLACES.map((place) => {
                const on = placeForPath(pathname) === place.id
                const Icon = ICONS[place.id]
                return (
                  <Link key={place.id} href={place.href} className="relative flex min-h-11 flex-1 flex-col items-center gap-0.5" style={{ color: on ? place.ink : '#5b6773' }}>
                    {on ? <span className="absolute -top-1 h-1 w-8 rounded-b" style={{ background: place.color }} /> : null}
                    <span className="grid h-8 w-12 place-items-center rounded-2xl" style={on ? { background: place.tint } : undefined}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className={`fd-ui text-[11px] ${on ? 'font-extrabold' : 'font-semibold'}`}>{place.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
          {menuOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button type="button" className="absolute inset-0 bg-[#15202B]/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
              <div className="absolute inset-y-0 left-0 bg-white shadow-xl">{sidebar}</div>
            </div>
          ) : null}
        </div>
      </ShellContext.Provider>
    </AuthProvider>
  )

  function LegacyBand({ pathname: path }: { pathname: string }) {
    const id = placeForPath(path)
    const place = id === 'more' ? null : placeById(id)
    return (
      <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: place ? `linear-gradient(150deg, ${place.color}, ${place.dark})` : '#1E2D3B' }}>
        <button type="button" className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <p className="fd-ui min-w-0 flex-1 truncate text-[18px] font-extrabold">{titleFor(path)}</p>
        <Link href="/admin/broadcast" className="fd-ui inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-3 text-[13px] font-extrabold text-[#5C3473]">
          <Megaphone className="h-4 w-4" aria-hidden /> Reach anyone
        </Link>
      </header>
    )
  }
}

function titleFor(pathname: string): string {
  const known: [string, string][] = [
    ['/admin/members', 'Member editor'],
    ['/admin/applications', 'Applications'],
    ['/admin/leads', 'Leads'],
    ['/admin/contact-requests', 'Visit requests'],
    ['/admin/coverage', 'Coverage'],
    ['/admin/revenue', 'Revenue detail'],
    ['/admin/content', 'Content & IG Live'],
    ['/admin/marketplace', 'Synapse'],
    ['/admin/seminars', 'Seminars'],
    ['/admin/jobs', 'Jobs'],
    ['/admin/logs', 'Older logs'],
    ['/admin/outreach', 'Outreach'],
    ['/admin/broadcast/messages', 'Earlier in-app broadcast'],
    ['/admin/notifications', 'Notifications'],
    ['/admin/inbox', 'Inbox'],
    ['/admin/settings', 'Settings'],
  ]
  const hit = known.find(([href]) => pathname === href || pathname.startsWith(`${href}/`))
  return hit ? hit[1] : 'Admin'
}

export function MenuButton() {
  const shell = useFounderShell()
  return (
    <button type="button" className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 lg:hidden" onClick={shell.openMenu} aria-label="Open menu">
      <Menu className="h-5 w-5" />
    </button>
  )
}

export function FindButton() {
  return <FindPalette />
}

function FindPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<{ title: string; subtitle: string; href: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function search(value: string) {
    setQuery(value)
    if (value.trim().length < 2) {
      setHits([])
      return
    }
    const response = await fetch(`/api/admin/find?q=${encodeURIComponent(value.trim())}`)
    if (!response.ok) return
    const data = await response.json()
    setHits(Array.isArray(data.hits) ? data.hits : [])
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="hidden min-h-11 items-center gap-2 rounded-[14px] bg-white/15 px-3 text-[14px] md:flex md:w-[220px]">
        <Search className="h-4 w-4" aria-hidden />
        <span className="flex-1 text-left opacity-90">Find anyone</span>
        <kbd className="fd-ui rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">⌘K</kbd>
      </button>
      <button type="button" onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 md:hidden" aria-label="Find anyone">
        <Search className="h-4 w-4" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] bg-[#15202B]/40 p-4" onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
          <div className="mx-auto mt-16 max-w-lg rounded-2xl bg-white p-3 text-[#15202B] shadow-xl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#5b6773]" />
              <input autoFocus value={query} onChange={(event) => search(event.target.value)} placeholder="Name, city, clinic, email" className="min-h-11 w-full bg-transparent text-[15px] outline-none" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="grid h-11 w-11 place-items-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 max-h-80 overflow-y-auto">
              {hits.length === 0 ? <p className="px-2 py-3 text-[13px] text-[#6b7785]">Type two letters. Doctors, community members, students, subscribers, and applications.</p> : hits.map((hit) => (
                <button key={hit.href + hit.title} type="button" className="flex min-h-11 w-full flex-col items-start rounded-xl px-2 py-2 text-left hover:bg-[#F5F3EF]" onClick={() => { setOpen(false); router.push(hit.href) }}>
                  <span className="fd-ui text-[14px] font-extrabold">{hit.title}</span>
                  <span className="text-[12px] text-[#6b7785]">{hit.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function AlertBell() {
  const { alerts } = useFounderShell()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/15" aria-label="Alerts">
        <Bell className="h-5 w-5" />
        {alerts.length ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#C2413B] px-1 text-[11px] font-extrabold">{alerts.length}</span> : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl bg-white p-3 text-[#15202B] shadow-xl">
          {alerts.length === 0 ? <p className="text-[13px] text-[#6b7785]">Nothing is waiting.</p> : alerts.map((alert) => (
            <Link key={alert.id} href={alert.href} onClick={() => setOpen(false)} className="block min-h-11 rounded-xl px-2 py-2 text-[13px] font-bold hover:bg-[#F5F3EF]">{alert.title}</Link>
          ))}
          <Link href="/admin/notifications" className="mt-1 block text-[12px] font-bold text-[#5b6773]">All notifications</Link>
        </div>
      ) : null}
    </div>
  )
}

export function ReachLink() {
  return (
    <Link href="/admin/broadcast" className="fd-ui inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-3 text-[14px] font-extrabold text-[#5C3473] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.4)]">
      <Megaphone className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Reach anyone</span>
    </Link>
  )
}
