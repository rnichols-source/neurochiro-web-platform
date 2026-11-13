import Link from 'next/link'
import { AlertBell, FindButton, MenuButton, ReachLink } from '@/app/(admin)/admin/admin-shell'
import { placeById, type PlaceId } from '@/lib/founder/places'

export function PlaceHeader({
  place,
  eyebrow,
  title,
  subtitle,
  segments,
  children,
}: {
  place: PlaceId
  eyebrow?: string
  title: string
  subtitle?: string
  segments?: { label: string; href: string; on: boolean }[]
  children?: React.ReactNode
}) {
  const tone = placeById(place)
  return (
    <header className="px-4 py-5 text-white md:px-8 md:py-6" style={{ background: `linear-gradient(150deg, ${tone.color}, ${tone.dark})`, ['--c' as string]: tone.color }}>
      <div className="flex flex-wrap items-center gap-3">
        <MenuButton />
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="text-[13px] text-white/80">{eyebrow}</p> : null}
          <h1 className="fd-ui text-[30px] font-extrabold leading-none tracking-tight md:text-[36px]">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-xl text-[15px] text-white/90">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <FindButton />
          <AlertBell />
          <ReachLink />
        </div>
      </div>
      {segments ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {segments.map((segment) => (
            <Link prefetch key={segment.href} href={segment.href} className={`fd-ui inline-flex min-h-11 items-center rounded-xl px-4 text-[14px] font-extrabold ${segment.on ? 'bg-white' : 'bg-black/15 text-white'}`} style={segment.on ? { color: tone.dark } : undefined}>
              {segment.label}
            </Link>
          ))}
        </div>
      ) : null}
      {children}
    </header>
  )
}
