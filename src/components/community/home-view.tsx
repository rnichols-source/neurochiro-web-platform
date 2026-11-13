import Image from 'next/image'
import Link from 'next/link'
import { AREAS } from '@/components/community/areas'
import { bleed } from '@/components/community/chrome'
import { AreaIcon, ChevronIcon, DumbbellIcon } from '@/components/community/icons'
import type { TodayFocus } from '@/lib/community/today'

const TILES = [
  { id: 'care' as const, href: '/portal/care', title: 'Care', line: 'Exercises & remedies' },
  { id: 'week' as const, href: '/portal/week', title: 'This Week', line: 'Live Thu 8 PM ET' },
  { id: 'refer' as const, href: '/portal/refer', title: 'Find & Refer', line: 'Travel · invite family' },
  { id: 'me' as const, href: '/portal/me', title: 'Me', line: 'Household · doctor' },
]

export function HomeView({
  greeting,
  name,
  initial,
  focus,
}: {
  greeting: string
  name: string | null
  initial: string
  focus: TodayFocus
}) {
  const hello = name ? `${greeting},` : greeting
  const action = focusAction(focus)
  return (
    <div>
      <header className={`nc-band ${bleed} rounded-b-[30px] px-[22px] pb-14 pt-4 text-white`} style={{ ['--c' as string]: AREAS.home.color, ['--d' as string]: AREAS.home.dark }}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-white">
            <Image src="/logo-mark.png" alt="" width={30} height={30} sizes="30px" className="h-[30px] w-[30px] object-contain" />
          </span>
          <span className="nc-ui flex-1 text-[19px] font-black tracking-[0.08em] text-white">NEUROCHIRO</span>
          <Link prefetch href="/portal/me" aria-label="Me" className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/60 bg-white/20 nc-ui text-[16px] font-extrabold text-white">
            {initial}
          </Link>
        </div>
        <p className="mt-5 text-[20px] font-bold leading-snug text-white">{hello}</p>
        {name ? <h1 className="nc-ui text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white">{name}</h1> : <h1 className="sr-only">Your NeuroChiro</h1>}
        <p className="nc-ui mt-6 text-[19px] font-extrabold uppercase tracking-[0.1em] text-white">
          Your one thing today
        </p>
      </header>

      <div className="relative z-[1] -mt-10">
        <article className="rounded-3xl bg-white p-[18px] shadow-[0_14px_30px_-12px_rgba(21,32,43,0.25)]">
          <div className="flex items-center gap-3.5">
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl" style={{ background: action.tint, color: action.ink }}>
              <action.Icon size={26} />
            </span>
            <div className="min-w-0">
              <p className="nc-ui text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-[#15202B]">{action.title}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-[#5b6773]">{action.detail}</p>
            </div>
          </div>
          {action.progress ? (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded bg-[#ECEAE5]" aria-hidden="true">
                <div className="h-full rounded" style={{ width: `${action.progress.pct}%`, background: action.color }} />
              </div>
              <p className="mt-1.5 text-[13px] font-bold text-[#5b6773]">{action.progress.label}</p>
            </>
          ) : null}
          <Link prefetch
            href={action.href}
            className="nc-ui mt-3.5 flex h-[52px] items-center justify-center gap-2 rounded-2xl text-[16px] font-extrabold text-white"
            style={{ background: action.color }}
          >
            {action.button}
            <ChevronIcon size={18} />
          </Link>
        </article>
      </div>

      <SectionGo />
    </div>
  )
}

function SectionGo() {
  return (
    <section>
      <h2 className="nc-ui mb-2.5 mt-[22px] text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#5b6773]">Go to</h2>
      <div className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => {
          const tone = AREAS[tile.id]
          return (
            <Link prefetch
              key={tile.id}
              href={tile.href}
              className="relative flex h-32 flex-col justify-end overflow-hidden rounded-[22px] p-4 text-white"
              style={{ background: tone.color }}
            >
              <span className="pointer-events-none absolute -right-8 -top-8 h-[110px] w-[110px] rounded-full bg-white/10" aria-hidden="true" />
              <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-[14px] bg-white/20">
                <AreaIcon id={tile.id} size={26} />
              </span>
              <span className="nc-ui text-[18px] font-extrabold tracking-[-0.02em]">{tile.title}</span>
              <span className="text-[13px] text-white/95">{tile.line}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function focusAction(focus: TodayFocus) {
  if (focus.kind === 'plan') {
    const pct = focus.plan.total > 0 ? Math.round((focus.plan.done / focus.plan.total) * 100) : 0
    return {
      title: "Do today's exercises",
      detail: `${focus.plan.title} · ${focus.plan.detail}`,
      href: focus.plan.href,
      button: focus.plan.done >= focus.plan.total ? 'Open my plan' : 'Continue',
      color: AREAS.care.color,
      ink: AREAS.care.ink,
      tint: AREAS.care.tint,
      Icon: DumbbellIcon,
      progress: { pct, label: `${focus.plan.done} of ${focus.plan.total} done` },
    }
  }
  if (focus.kind === 'doctor') {
    return {
      title: 'Choose a home doctor',
      detail: 'A listed nervous system chiropractor stays on Care.',
      href: '/portal/find',
      button: 'Find a doctor',
      color: AREAS.care.color,
      ink: AREAS.care.ink,
      tint: AREAS.care.tint,
      Icon: () => <AreaIcon id="care" size={26} />,
      progress: null,
    }
  }
  if (focus.kind === 'checkin') {
    return {
      title: "Do this week's check-in",
      detail: "How is your family's nervous system this week?",
      href: '/portal/week',
      button: 'Check in',
      color: AREAS.week.color,
      ink: AREAS.week.ink,
      tint: AREAS.week.tint,
      Icon: () => <AreaIcon id="week" size={26} />,
      progress: null,
    }
  }
  return {
    title: 'The Weekly Adjustment',
    detail: 'Thursday · 8 PM ET live Q&A',
    href: '/portal/week',
    button: 'Open This Week',
    color: AREAS.week.color,
    ink: AREAS.week.ink,
    tint: AREAS.week.tint,
    Icon: () => <AreaIcon id="week" size={26} />,
    progress: null,
  }
}
