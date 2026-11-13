import Link from 'next/link'
import { HeaderTools } from '@/components/doctor/header-tools'
import { ChevronIcon, PencilIcon, PlaceIcon } from '@/components/doctor/icons'
import { SkipProfileButton } from '@/components/doctor/skip-profile'
import { DOCTOR_PLACES } from '@/lib/doctor/places'
import type { TodayData } from '@/lib/doctor/portal-data'

const TILES = [
  { id: 'people' as const, href: '/doctor/people', title: 'People' },
  { id: 'care' as const, href: '/doctor/care-sets', title: 'Care sets' },
  { id: 'network' as const, href: '/doctor/network', title: 'Network' },
  { id: 'practice' as const, href: '/doctor/practice', title: 'Practice' },
]

export function TodayView({ data }: { data: TodayData }) {
  const step = data.step
  const careLine = data.plansInUse == null
    ? `${data.libraryCount} plans in the library`
    : `${data.plansInUse} plans in use · ${data.libraryCount} in library`
  const networkLine = data.studentsNear == null
    ? `${data.newReferrals} new referrals`
    : `${data.newReferrals} new referrals · ${data.studentsNear} students near you`
  const lines: Record<string, string> = {
    people: data.waiting === 1 ? '1 waiting for you' : `${data.waiting} waiting for you`,
    care: careLine,
    network: networkLine,
    practice: `${data.checklist.percent}% · profile, billing, tools`,
  }
  const numbers: Record<string, string> = {
    people: String(data.waiting),
    care: data.plansInUse == null ? String(data.libraryCount) : String(data.plansInUse),
    network: String(data.newReferrals),
    practice: `${data.checklist.percent}%`,
  }
  const doing = data.memberCount === 0 ? '0' : `${data.doingWell} of ${data.memberCount}`
  const doingLabel = data.memberCount === 0 ? 'community members yet' : 'doing well this week'

  return (
    <div data-patient-requests={data.requestCount ?? ''}>
      <header
        className="dp-band dp-bleed relative rounded-b-[30px] px-[22px] pb-16 pt-4 text-white lg:rounded-none lg:px-10 lg:pb-10 lg:pt-8"
        style={{ ['--c' as string]: DOCTOR_PLACES.today.color, ['--d' as string]: DOCTOR_PLACES.today.dark }}
      >
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-4">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-white">
              <img src="/logo.png" alt="" className="h-[30px] w-[30px] object-contain" />
            </span>
            <span className="dp-ui text-[13px] font-extrabold tracking-[0.08em]">NEUROCHIRO</span>
            <span className="dp-ui rounded-full bg-white/20 px-2 py-1 text-[11px] font-extrabold">Doctor</span>
          </div>
          <div className="col-span-2 lg:col-span-1 lg:row-start-1">
            <p className="text-[16px] text-white/90">{data.dateLabel}</p>
            <h1 className="dp-ui mt-1 text-[34px] font-extrabold leading-none tracking-[-0.03em] lg:text-[40px]">
              {data.greetingLine}, {data.doctorName}
            </h1>
          </div>
          <div className="col-start-2 row-start-1 flex items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              <Stat value={String(data.waiting)} label="waiting" />
              <Stat value={String(data.newReferrals)} label="new referrals" />
              <Stat value={doing} label={doingLabel} />
            </div>
            <HeaderTools />
            <Link href="/doctor/practice" aria-label="Practice" className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/70 bg-white/20 dp-ui text-[13px] font-extrabold lg:hidden">
              {data.initials}
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-[1] -mt-10 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <article className="rounded-[26px] bg-white p-5 shadow-[0_14px_30px_-18px_rgba(21,32,43,0.35)]">
          <p className="dp-ui text-[12px] font-extrabold tracking-[0.1em] text-[#D66829]" style={{ textTransform: 'uppercase' }}>
            {step.id === 'clear' ? 'Today' : `Your next step · ${data.stepIndex} of ${Math.max(data.stepTotal, 1)}`}
          </p>
          <div className="mt-3 flex items-center gap-3.5">
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-[#FCEBDF] text-[#D66829]">
              <PencilIcon />
            </span>
            <div>
              <h2 className="dp-ui text-[22px] font-extrabold tracking-[-0.02em] text-[#15202B]">{step.title}</h2>
              <p className="mt-0.5 text-[14px] text-[#5b6773]">{step.detail}</p>
            </div>
          </div>
          {step.percent != null ? (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded bg-[#ECEAE5]" aria-hidden="true">
                <div className="h-full rounded bg-[#D66829]" style={{ width: `${step.percent}%` }} />
              </div>
              <p className="mt-1.5 text-[13px] font-bold text-[#5b6773]">{step.percent}% complete</p>
            </>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={step.href} className="dp-ui inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#D66829] px-5 text-[16px] font-extrabold text-white">
              {step.button}
              <ChevronIcon />
            </Link>
            {step.skip ? <SkipProfileButton /> : null}
          </div>
        </article>
        <aside className="rounded-[26px] bg-white p-5 shadow-[0_14px_30px_-18px_rgba(21,32,43,0.2)] lg:border-l lg:border-[#EFECE7] lg:shadow-none">
          <p className="dp-ui text-[12px] font-extrabold tracking-[0.12em] text-[#6b7785]" style={{ textTransform: 'uppercase' }}>Then</p>
          {data.thenItems.length === 0 ? (
            <p className="mt-3 text-[14px] leading-snug text-[#5b6773]">Nothing else is waiting. New visit requests and referrals show up here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.thenItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#F7F6F3] px-3 py-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E2ECF8] dp-ui text-[13px] font-extrabold text-[#1F4F8C]">
                    {item.title.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="dp-ui block text-[11px] font-extrabold tracking-[0.08em] text-[#2C6BB4]" style={{ textTransform: 'uppercase' }}>{item.kind}</span>
                    <span className="dp-ui block truncate text-[15px] font-extrabold text-[#15202B]">{item.title}</span>
                    <span className="block truncate text-[13px] text-[#5b6773]">{item.subtitle}</span>
                  </span>
                  <Link href={item.href} className="dp-ui inline-flex min-h-11 items-center rounded-xl bg-[#2C6BB4] px-3 text-[13px] font-extrabold text-white">{item.action}</Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((tile) => {
          const tone = DOCTOR_PLACES[tile.id]
          return (
            <Link key={tile.id} href={tile.href} className="relative flex h-[150px] flex-col justify-end overflow-hidden rounded-[22px] p-4 text-white lg:h-[170px]" style={{ background: tone.color }}>
              <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
              <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
                <PlaceIcon id={tile.id} size={22} />
              </span>
              <span className="dp-ui absolute right-4 top-3 text-[32px] font-extrabold leading-none lg:text-[40px]">{numbers[tile.id]}</span>
              <span className="dp-ui text-[18px] font-extrabold">{tile.title}</span>
              <span className="text-[13px] text-white/90">{lines[tile.id]}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ value, label, light = false }: { value: string; label: string; light?: boolean }) {
  return (
    <div className={`min-w-[108px] rounded-2xl px-3 py-2 ${light ? 'bg-[#F7F6F3] text-[#15202B]' : 'bg-white/15 text-white'}`}>
      <b className="dp-ui block text-[22px] font-extrabold leading-none">{value}</b>
      <span className={`mt-1 block text-[12px] ${light ? 'text-[#5b6773]' : 'text-white/90'}`}>{label}</span>
    </div>
  )
}
