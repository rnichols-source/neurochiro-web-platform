'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DOCTOR_PLACES, toolLinksFor, type DoctorToolGroup } from '@/lib/doctor/places'

export function ToolChips({ group }: { group: DoctorToolGroup }) {
  const pathname = usePathname() || ''
  const links = toolLinksFor(group)
  const tone = DOCTOR_PLACES[links[0]?.place || 'practice']
  if (!links.length) return null
  return (
    <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" aria-label={group === 'people' ? 'People tools' : 'Network tools'}>
      {links.map((link) => {
        const on = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={on ? 'page' : undefined}
            title={link.detail}
            className="dp-ui inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-[14px] font-extrabold"
            style={on ? { background: tone.color, color: '#fff' } : { background: '#fff', color: tone.ink }}
          >
            {link.chipLabel || link.label}
          </Link>
        )
      })}
    </div>
  )
}
