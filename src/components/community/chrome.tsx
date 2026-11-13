import Link from 'next/link'
import { AREAS, type AreaId } from '@/components/community/areas'
import { AreaIcon, BackIcon } from '@/components/community/icons'

export const bleed = '-mx-[18px] lg:-mx-10'

export function displayTitle(value: string): string {
  return value.replace(/\p{Extended_Pictographic}|\uFE0F/gu, '').replace(/\s+/g, ' ').trim()
}

export function AreaBand({
  area,
  title,
  subtitle,
  mobileSubtitle = true,
  children,
  home = false,
}: {
  area: AreaId
  title: string
  subtitle?: string
  mobileSubtitle?: boolean
  children?: React.ReactNode
  home?: boolean
}) {
  const tone = AREAS[area]
  return (
    <header
      className={`nc-band ${bleed} px-[22px] text-white lg:px-10 ${home ? 'rounded-b-[30px] pb-16 pt-4' : 'rounded-b-[30px] pb-[22px] pt-4 lg:rounded-none lg:pb-8 lg:pt-8'}`}
      style={{ ['--c' as string]: tone.color, ['--d' as string]: tone.dark }}
    >
      <div className="flex items-center gap-3.5">
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-white/20 text-white">
          <AreaIcon id={area} size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="nc-ui text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white lg:text-[34px]">{title}</h1>
          {subtitle ? <p className="mt-1 hidden text-[16px] leading-snug text-white lg:block">{subtitle}</p> : null}
        </div>
        {children}
      </div>
      {subtitle && mobileSubtitle ? <p className="mt-2.5 text-[15px] leading-snug text-white lg:hidden">{subtitle}</p> : null}
    </header>
  )
}

export function BackHeading({
  title,
  href = '/portal',
  label = 'Home',
  crumb,
  area = 'care',
}: {
  title: string
  href?: string
  label?: string
  crumb?: string
  area?: AreaId
}) {
  const tone = AREAS[area]
  return (
    <header
      className={`nc-band ${bleed} rounded-b-[26px] px-5 pb-[18px] pt-3 text-white lg:rounded-none lg:px-10 lg:pb-7 lg:pt-6`}
      style={{ ['--c' as string]: tone.color, ['--d' as string]: tone.dark }}
    >
      <Link prefetch href={href} className="nc-ui inline-flex min-h-11 items-center gap-0.5 rounded-full bg-white/20 py-1.5 pl-2 pr-3.5 text-[15px] font-extrabold text-white">
        <BackIcon />
        {label}
      </Link>
      {crumb ? <p className="mt-3 text-[12px] font-bold text-white/90">{crumb}</p> : null}
      <h1 className="nc-ui mt-1 text-[23px] font-extrabold leading-[1.15] tracking-[-0.025em] text-white">{title}</h1>
    </header>
  )
}

export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`nc-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#5b6773] ${className}`}>{children}</p>
}

export function StepHeading({ n, children, color }: { n: number; children: React.ReactNode; color: string }) {
  return (
    <div className="mb-2.5 mt-[18px] flex items-center gap-2.5">
      <span className="nc-ui grid h-[26px] w-[26px] place-items-center rounded-full text-[13px] font-extrabold text-white" style={{ background: color }}>{n}</span>
      <h2 className="nc-ui text-[17px] font-extrabold tracking-[-0.02em] text-[#15202B]">{children}</h2>
    </div>
  )
}
