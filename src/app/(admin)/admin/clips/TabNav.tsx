'use client'

import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Generator', href: '/admin/clips' },
  { label: 'Library', href: '/admin/clips/library' },
  { label: 'Batch', href: '/admin/clips/batch' },
  { label: 'Delivery', href: '/admin/clips/delivery' },
  { label: 'Approve', href: '/admin/clips/approve' },
]

export default function TabNav() {
  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === '/admin/clips') return pathname === '/admin/clips'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex items-center gap-1 bg-[#1a2744] rounded-xl p-1">
      {TABS.map((tab) => (
        <a
          key={tab.href}
          href={tab.href}
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-medium transition ${
            isActive(tab.href)
              ? 'bg-[#D66829] text-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  )
}
