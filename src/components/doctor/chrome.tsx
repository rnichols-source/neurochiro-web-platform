import Link from 'next/link'
import { HeaderTools } from '@/components/doctor/header-tools'
import { PlaceIcon } from '@/components/doctor/icons'
import { DOCTOR_PLACES, type DoctorPlaceId } from '@/lib/doctor/places'

export function DoctorBand({
  place,
  title,
  subtitle,
  children,
  footer,
  home = false,
  bleed = true,
  icon,
}: {
  place: DoctorPlaceId
  title: string
  subtitle?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  home?: boolean
  bleed?: boolean
  icon?: React.ReactNode
}) {
  const tone = DOCTOR_PLACES[place]
  return (
    <header
      className={`dp-band ${bleed ? 'dp-bleed' : ''} px-[22px] text-white lg:px-10 ${home ? 'rounded-b-[30px] pb-8 pt-4 lg:rounded-none lg:pb-9 lg:pt-8' : 'rounded-b-[26px] pb-5 pt-4 lg:rounded-none lg:pb-8 lg:pt-8'}`}
      style={{ ['--c' as string]: tone.color, ['--d' as string]: tone.dark }}
    >
      <div className="flex items-start gap-4">
        {home ? null : (
          <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-white/20 text-white">
            {icon || <PlaceIcon id={place} size={26} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="dp-ui text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white lg:text-[34px]">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-[15px] leading-snug text-white/90 lg:text-[16px]">{subtitle}</p> : null}
        </div>
        <HeaderTools />
        {children}
      </div>
      {footer}
    </header>
  )
}

export function SubTabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string }[]
  active: string
}) {
  return (
    <div className="mt-4 flex gap-1 rounded-2xl bg-black/15 p-1">
      {tabs.map((tab) => {
        const on = tab.href === active
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={on ? 'page' : undefined}
            className={`dp-ui flex min-h-11 flex-1 items-center justify-center rounded-xl px-2 text-[14px] font-extrabold ${on ? 'bg-white text-[#5C3473]' : 'text-white/90'}`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

export function EmptyNote({ title, sentence }: { title: string; sentence: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#D7DEE6] bg-white px-4 py-6">
      <p className="dp-ui text-[16px] font-extrabold text-[#15202B]">{title}</p>
      <p className="mt-1 text-[14px] leading-snug text-[#5b6773]">{sentence}</p>
    </div>
  )
}
