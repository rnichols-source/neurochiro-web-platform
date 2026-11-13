'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AccountPanel } from '@/components/community/account-panel'
import { AREAS } from '@/components/community/areas'
import { bleed } from '@/components/community/chrome'
import { BellIcon, BriefcaseIcon, ChevronIcon, LockIcon, SignOutIcon, StethoscopeIcon, UsersIcon } from '@/components/community/icons'
import { createClient } from '@/lib/supabase'

const me = AREAS.me

export type MeRow = {
  href: string
  title: string
  line: string
  icon: 'household' | 'doctor' | 'privacy' | 'reminders' | 'work'
  color: string
  tag?: string | null
}

export function MeView({
  name,
  initial,
  email,
  rows,
}: {
  name: string
  initial: string
  email: string
  rows: { people: MeRow[]; settings: MeRow[]; work: MeRow }
}) {
  return (
    <div>
      <header className={`nc-band ${bleed} rounded-b-[30px] px-[22px] pb-6 pt-4 text-white lg:rounded-none lg:px-10 lg:py-8`} style={{ ['--c' as string]: me.color, ['--d' as string]: me.dark }}>
        <div className="mt-2 flex items-center gap-4">
          <span className="grid h-[66px] w-[66px] place-items-center rounded-full border-[3px] border-white/70 bg-[#D66829] nc-ui text-[26px] font-extrabold text-white">{initial}</span>
          <div>
            <h1 className="nc-ui text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-white">{name}</h1>
            <span className="nc-ui mt-1.5 inline-block rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-bold text-white">Community member</span>
          </div>
        </div>
      </header>

      <Group label="My people & doctor" rows={rows.people} />
      <Group label="Settings" rows={rows.settings} />
      <Group label="Opportunities" rows={[rows.work]} />
      <SignOut />
      <details className="mt-4 rounded-[20px] bg-white px-3.5 py-2">
        <summary className="nc-ui flex min-h-11 cursor-pointer items-center text-[15px] font-extrabold text-[#15202B]">Password</summary>
        <div className="pb-3">
          <AccountPanel name={name} email={email} hideSignOut />
        </div>
      </details>
    </div>
  )
}

function Group({ label, rows }: { label: string; rows: MeRow[] }) {
  return (
    <section className="mt-5">
      <p className="nc-ui mb-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#5b6773]">{label}</p>
      <div className="overflow-hidden rounded-[20px] bg-white">
        {rows.map((row) => (
          <Link prefetch key={row.href + row.title} href={row.href} className="flex min-h-[64px] items-center gap-3 border-t border-[#EFECE7] px-3.5 py-3 first:border-t-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: row.color }}>
              <RowIcon id={row.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="nc-ui block text-[15px] font-extrabold text-[#15202B]">{row.title}</span>
              <span className="block truncate text-[13px] text-[#5b6773]">{row.line}</span>
            </span>
            {row.tag ? <span className="nc-ui shrink-0 rounded-full bg-[#E2ECF8] px-2 py-1 text-[11px] font-extrabold text-[#1F4F8C]">{row.tag}</span> : null}
            <ChevronIcon size={18} className="text-[#b0b8c1]" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function RowIcon({ id }: { id: MeRow['icon'] }) {
  if (id === 'household') return <UsersIcon />
  if (id === 'doctor') return <StethoscopeIcon />
  if (id === 'privacy') return <LockIcon />
  if (id === 'reminders') return <BellIcon size={20} />
  return <BriefcaseIcon />
}

function SignOut() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
      }}
      className="nc-ui mt-4 flex min-h-11 w-full items-center justify-center gap-2 text-[14px] font-extrabold text-[#5b6773]"
    >
      <SignOutIcon />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
