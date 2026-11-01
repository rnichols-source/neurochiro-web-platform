'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { moreNav, navIsActive, primaryNav } from './nav'

function Badge({ count }: { count: number | null }) {
  if (count === null) {
    return <span className="ml-auto inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">!</span>
  }
  if (count <= 0) return null
  return <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{count}</span>
}

export default function Sidebar({
  leadAttention,
  onNavigate,
}: {
  leadAttention: number | null
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-neuro-navy text-white md:flex">
      <div className="px-4 py-5">
        <Link href="/admin" className="block">
          <span className="font-heading text-lg font-bold">NeuroChiro</span>
          <span className="mt-1 block text-xs text-white/70">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {primaryNav.map((item) => {
          const active = navIsActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${active ? 'bg-neuro-orange text-white' : 'text-white/80 hover:bg-white/10'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
              {item.badge === 'leads' ? <Badge count={leadAttention} /> : null}
            </Link>
          )
        })}
        <details className="pt-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl px-3 text-sm text-white/80 hover:bg-white/10">
            More
          </summary>
          <div className="mt-1 space-y-1">
            {moreNav.map((item) => {
              const active = navIsActive(pathname, item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${active ? 'bg-neuro-orange text-white' : 'text-white/80 hover:bg-white/10'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </details>
      </nav>
    </aside>
  )
}
