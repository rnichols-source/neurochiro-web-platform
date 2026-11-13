'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HeaderTools } from '@/components/doctor/header-tools'
import { MessagesIcon, PlaceIcon, RocketIcon, SignOutIcon } from '@/components/doctor/icons'
import { usePortal } from '@/components/portal/PortalProvider'
import { createClient } from '@/lib/supabase'
import {
  DOCTOR_PLACE_LIST,
  DOCTOR_PLACES,
  DOCTOR_TOOL_GROUPS,
  DOCTOR_TOOL_LINKS,
  doctorNavId,
  legacyTitle,
  usesOwnChrome,
  type DoctorPlaceId,
} from '@/lib/doctor/places'
import '@/styles/doctor-portal.css'

function badge(count: number) {
  if (count < 1) return null
  return count > 99 ? '99+' : String(count)
}

export default function DoctorShell({ children, waiting }: { children: React.ReactNode; waiting: number }) {
  const pathname = usePathname() || '/doctor'
  const ctx = usePortal()
  const nav = doctorNavId(pathname)
  const own = usesOwnChrome(pathname)
  const messages = pathname.startsWith('/doctor/messages')
  const placeLine = [ctx.doctor?.clinic_name, ctx.doctor?.city].filter(Boolean).join(' · ')
  const messageBadge = badge(ctx.unreadMessages)
  const peopleBadge = badge(waiting)

  function signOut() {
    const supabase = createClient()
    supabase.auth.signOut().then(() => {
      window.location.href = '/'
    })
  }

  return (
    <div className="doctor-portal flex h-dvh min-h-0 bg-[#F5F3EF] text-[#15202B]" data-portal-notifications={ctx.unreadNotifications}>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-[#ECE8E1] bg-white px-4 py-6 lg:flex">
        <Link href="/doctor" className="mb-3 flex items-center gap-2.5 px-2">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-[#F5F3EF]">
            <img src="/logo.png" alt="" className="h-[30px] w-[30px] object-contain" />
          </span>
          <span className="min-w-0">
            <span className="dp-ui block text-[14px] font-extrabold tracking-[0.08em] text-[#15202B]">NEUROCHIRO</span>
            <span className="dp-ui block text-[11px] font-extrabold tracking-[0.12em] text-[#8a95a1]">DOCTOR PORTAL</span>
          </span>
        </Link>
        <nav className="flex min-h-0 flex-1 flex-col" aria-label="Doctor portal">
          <div className="flex shrink-0 flex-col gap-1.5">
            {DOCTOR_PLACE_LIST.map((item) => {
              const on = nav === item.id
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={on ? 'page' : undefined}
                  className="relative flex min-h-11 items-center gap-3 rounded-[14px] px-3 dp-ui text-[16px]"
                  style={on ? { background: item.tint, color: item.ink, fontWeight: 800 } : { color: '#3d4a57', fontWeight: 700 }}
                >
                  {on ? <span className="absolute -left-4 bottom-2.5 top-2.5 w-[5px] rounded-r" style={{ background: item.color }} /> : null}
                  <span
                    className="grid h-[38px] w-[38px] place-items-center rounded-xl"
                    style={on ? { background: item.color, color: '#fff' } : { background: item.tint, color: item.ink }}
                  >
                    <PlaceIcon id={item.id} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">{item.label}</span>
                  {item.id === 'people' && peopleBadge ? (
                    <span className="dp-ui grid h-6 min-w-6 place-items-center rounded-full bg-[#2C6BB4] px-1.5 text-[12px] font-extrabold text-white">{peopleBadge}</span>
                  ) : null}
                </Link>
              )
            })}
            <div className="my-2 border-t border-[#EFECE7]" />
            <Link
              href="/doctor/messages"
              aria-current={nav === 'messages' ? 'page' : undefined}
              className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 dp-ui text-[16px] font-bold"
              style={nav === 'messages' ? { background: '#E5E9EE', color: '#1E2D3B' } : { color: '#3d4a57' }}
            >
              <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-[#E5E9EE] text-[#1E2D3B]">
                <MessagesIcon size={20} />
              </span>
              <span className="flex-1">Messages</span>
              {messageBadge ? (
                <span className="dp-ui grid h-6 min-w-6 place-items-center rounded-full bg-[#D66829] px-1.5 text-[12px] font-extrabold text-white" data-messages-badge={ctx.unreadMessages}>{messageBadge}</span>
              ) : null}
            </Link>
            <Link
              href="/doctor/coming-soon"
              aria-current={nav === 'soon' ? 'page' : undefined}
              className="flex min-h-11 items-center gap-3 rounded-[14px] px-3 dp-ui text-[16px] font-bold text-[#3d4a57]"
              style={nav === 'soon' ? { background: '#FCEBDF', color: '#B4501A' } : undefined}
            >
              <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-[#FCEBDF] text-[#D66829]">
                <RocketIcon />
              </span>
            Coming soon
          </Link>
            <Link
              href="/doctor/profile"
              aria-current={pathname === '/doctor/profile' ? 'page' : undefined}
              className="mt-1 flex min-h-11 items-center gap-3 rounded-[14px] px-3 dp-ui text-[16px] font-extrabold"
              style={pathname === '/doctor/profile' ? { background: '#E5E9EE', color: '#1E2D3B' } : { color: '#1E2D3B' }}
            >
              <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-[#1E2D3B] text-[12px] font-extrabold text-white">
                {ctx.initials || 'DR'}
              </span>
              Profile
            </Link>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-[#EFECE7] pt-3">
            <p className="px-3 pb-2 dp-ui text-[11px] font-extrabold tracking-[0.12em] text-[#8a95a1]">YOUR TOOLS</p>
            {DOCTOR_TOOL_GROUPS.map((group) => {
              const tone = DOCTOR_PLACES[group.place]
              const links = DOCTOR_TOOL_LINKS.filter((link) => link.group === group.id && link.href !== '/doctor/profile')
              return (
                <div key={group.id} className="mb-3">
                  <p className="px-3 pb-1 dp-ui text-[11px] font-extrabold tracking-[0.08em]" style={{ color: tone.ink }}>{group.label}</p>
                  {links.map((link) => {
                    const on = pathname === link.href || pathname.startsWith(`${link.href}/`)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        aria-current={on ? 'page' : undefined}
                        className="flex min-h-11 items-center gap-2 rounded-xl px-3 dp-ui text-[14px] font-bold"
                        style={on ? { background: tone.tint, color: tone.ink } : { color: '#3d4a57' }}
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tone.color }} />
                        <span className="min-w-0 truncate">{link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </nav>
        <div className="mt-4 flex items-center gap-2.5 border-t border-[#EFECE7] px-1 pt-3">
          <Link href="/doctor/practice" aria-label="Practice" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#D66829] dp-ui text-[14px] font-extrabold text-white">
            {ctx.initials || 'DR'}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="dp-ui truncate text-[13px] font-extrabold leading-tight text-[#15202B]">{ctx.fullName || 'Doctor'}</p>
            <p className="truncate text-[12px] text-[#5b6773]">{placeLine || 'Your practice'}</p>
          </div>
          <button type="button" onClick={signOut} className="inline-flex min-h-11 min-w-11 items-center justify-center text-[#5b6773]" aria-label="Sign out">
            <SignOutIcon />
          </button>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {ctx.membership.tier === 'free' ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E7E2D8] bg-[#FCEBDF] px-4 py-3">
            <p className="text-[14px] text-[#15202B]">Activate Pro to open visit requests and results.</p>
            <Link href="/doctor/billing" className="dp-ui inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-4 text-[14px] font-extrabold text-white">Activate Pro</Link>
          </div>
        ) : null}
        <main
          className={messages
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0'
            : 'min-h-0 flex-1 overflow-y-auto px-[18px] pb-28 lg:px-10 lg:pb-12'}
        >
          {own ? null : (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
              <p className="dp-ui text-[14px] font-extrabold text-[#15202B]">{legacyTitle(pathname)}</p>
              <HeaderTools onDark={false} />
            </div>
          )}
          {children}
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3e0da] bg-white px-1.5 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(21,32,43,0.06)] lg:hidden"
        aria-label="Doctor portal"
      >
        <div className="mx-auto flex max-w-[720px]">
          {DOCTOR_PLACE_LIST.map((item) => {
            const on = nav === item.id
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={on ? 'page' : undefined}
                className="relative flex min-h-11 min-w-0 flex-1 flex-col items-center gap-[3px] pt-1"
                style={{ color: on ? item.ink : '#5b6773' }}
              >
                {on ? <span className="absolute -top-2 h-1 w-[34px] rounded-b" style={{ background: item.color }} /> : null}
                <span className="grid h-8 w-[58px] place-items-center rounded-2xl" style={on ? { background: item.tint, color: item.ink } : undefined}>
                  <PlaceIcon id={item.id as DoctorPlaceId} size={22} strokeWidth={on ? 2.1 : 1.8} />
                </span>
                <span className={`dp-ui whitespace-nowrap text-[11px] tracking-[-0.01em] ${on ? 'font-extrabold' : 'font-semibold'}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
