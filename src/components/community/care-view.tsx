import Link from 'next/link'
import { AREAS } from '@/components/community/areas'
import { AreaBand, StepHeading } from '@/components/community/chrome'
import { EmergencyBar, EmergencyButton, type EmergencyContact } from '@/components/community/emergency-button'
import { BasketIcon, ChevronIcon, LinkIcon, ListIcon, SearchIcon } from '@/components/community/icons'
import { LIBRARY_COPY } from '@/lib/community/library-model'

const care = AREAS.care

export type CareDoctor = {
  id: string
  title: string
  meta: string
  initials: string
  photoUrl: string | null
  listed: boolean
}

export type CarePhaseChip = { label: string; on: boolean }

export type CarePlan = {
  title: string
  assignedBy: string
  phases: CarePhaseChip[]
  meta: string
}

export type CareChip = { label: string; href: string }

export function CareView({
  doctor,
  plan,
  chips,
  contacts,
  requests,
}: {
  doctor: CareDoctor | null
  plan: CarePlan | null
  chips: CareChip[]
  contacts: EmergencyContact[]
  requests: { id: string; label: string }[]
}) {
  return (
    <div>
      <AreaBand area="care" title="Care" subtitle="Your plan from your doctor, and remedies for home." mobileSubtitle={false}>
        <span className="lg:hidden"><EmergencyButton contacts={contacts} /></span>
        <span className="hidden lg:block"><DoctorRow doctor={doctor} onBand /></span>
      </AreaBand>

      <div className="mt-4 lg:hidden">
        <DoctorRow doctor={doctor} />
      </div>

      {requests.length > 0 ? (
        <ul className="mt-3 rounded-[18px] bg-white px-3.5 py-3 text-[14px] text-[#3d4a57]">
          {requests.slice(0, 5).map((request) => (
            <li key={request.id}>{request.label}</li>
          ))}
        </ul>
      ) : null}

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        <section>
          <StepHeading n={1} color={care.color}>My exercise plan</StepHeading>
          {plan ? (
            <article className="relative rounded-3xl bg-gradient-to-br from-[#0E857A] to-[#0A6159] p-[18px] text-white lg:p-6">
              <span className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-[14px] bg-white/20">
                <LinkIcon />
              </span>
              <p className="text-[12px] font-bold text-white/90">{plan.assignedBy}</p>
              <h3 className="nc-ui mr-14 mt-1.5 text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-white lg:text-[24px]">{plan.title}</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.phases.map((phase) => (
                  <span key={phase.label} className={`nc-ui rounded-full px-2.5 py-1.5 text-[12px] font-bold ${phase.on ? 'bg-white text-[#0A6159]' : 'bg-white/15 text-white'}`}>
                    {phase.label}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[13px] text-white/95">{plan.meta}</p>
              <Link prefetch href="/portal/care/exercises" className="nc-ui mt-3.5 flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-white text-[16px] font-extrabold text-[#0A6159]">
                Open my plan
                <ChevronIcon size={18} />
              </Link>
            </article>
          ) : (
            <article className="rounded-3xl border border-[#BFE3DD] bg-white p-[18px]">
              <h3 className="nc-ui text-[17px] font-extrabold text-[#15202B]">Nothing assigned yet</h3>
              <p className="mt-1.5 text-[14px] leading-snug text-[#5b6773]">{LIBRARY_COPY.nothingAssigned}</p>
            </article>
          )}
        </section>

        <section id="remedies">
          <StepHeading n={2} color={care.color}>Home remedy guide</StepHeading>
          <div id="message" className="rounded-3xl border-[1.5px] border-[#BFE3DD] bg-[#DCF1EE] p-3.5 lg:p-5">
            <form action="/portal/care/remedies" className="flex min-h-[52px] items-center gap-2.5 rounded-[14px] bg-white px-3.5 text-[#0E857A]">
              <SearchIcon />
              <label className="sr-only" htmlFor="remedy-q">{LIBRARY_COPY.searchLabel}</label>
              <input
                id="remedy-q"
                name="q"
                placeholder="What's going on? e.g. sore throat"
                className="h-11 w-full bg-transparent text-[15px] text-[#15202B] outline-none placeholder:text-[#7d8893]"
              />
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Link prefetch key={chip.label} href={chip.href} className="nc-ui inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-bold text-[#0A6159]">
                  {chip.label}
                </Link>
              ))}
            </div>
            <div className="mt-2.5 flex gap-2">
              <Link prefetch href="/portal/care/remedies/shopping" className="nc-ui inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-[#A9D8D0] px-2 text-[13px] font-bold text-[#0A6159]">
                <BasketIcon />
                Shopping list
              </Link>
              <Link prefetch href="/portal/care/remedies/protocols" className="nc-ui inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-[#A9D8D0] px-2 text-[13px] font-bold text-[#0A6159]">
                <ListIcon />
                Daily protocols
              </Link>
            </div>
            <div className="hidden lg:block">
              <EmergencyBar contacts={contacts} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function DoctorRow({ doctor, onBand = false }: { doctor: CareDoctor | null; onBand?: boolean }) {
  if (!doctor) {
    return (
      <div className={`flex items-center gap-3 rounded-[18px] p-3 ${onBand ? 'bg-white/15 text-white' : 'bg-white'}`}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E5E9EE] nc-ui text-[14px] font-extrabold text-[#1E2D3B]">NC</span>
        <div className="min-w-0 flex-1">
          <p className={`nc-ui text-[15px] font-extrabold ${onBand ? 'text-white' : 'text-[#15202B]'}`}>Choose a home doctor</p>
          <p className={`text-[13px] ${onBand ? 'text-white/85' : 'text-[#5b6773]'}`}>A listed nervous system chiropractor</p>
        </div>
        <Link prefetch href="/portal/find" className={`nc-ui inline-flex min-h-11 items-center rounded-xl px-3 text-[13px] font-extrabold ${onBand ? 'bg-white text-[#0A6159]' : 'bg-[#0E857A] text-white'}`}>
          Find
        </Link>
      </div>
    )
  }
  return (
    <div className={`flex items-center gap-3 rounded-[18px] p-3 ${onBand ? 'w-[390px] max-w-full bg-white/15 text-white' : 'bg-white'}`}>
      {doctor.photoUrl ? (
        <img src={doctor.photoUrl} alt="" className="h-[42px] w-[42px] shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#E5E9EE] nc-ui text-[14px] font-extrabold text-[#1E2D3B]">{doctor.initials}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className={`nc-ui truncate text-[15px] font-extrabold ${onBand ? 'text-white' : 'text-[#15202B]'}`}>{doctor.title}</p>
        <p className={`truncate text-[13px] ${onBand ? 'text-white/85' : 'text-[#5b6773]'}`}>{doctor.meta}</p>
      </div>
      {doctor.listed ? (
        <Link prefetch href={`/portal/visit?doctor=${doctor.id}`} className={`nc-ui inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-[13px] font-extrabold ${onBand ? 'bg-white text-[#0A6159]' : 'bg-[#0E857A] text-white'}`}>
          Request visit
        </Link>
      ) : (
        <Link prefetch href="/portal/find" className="nc-ui inline-flex min-h-11 shrink-0 items-center rounded-xl bg-white px-3 text-[13px] font-extrabold text-[#0A6159]">
          Change
        </Link>
      )}
    </div>
  )
}
