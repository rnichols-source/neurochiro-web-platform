import Link from 'next/link'
import { AREAS } from '@/components/community/areas'
import { AreaBand, SectionLabel } from '@/components/community/chrome'
import { ChevronIcon, PinIcon, PlaneIcon, SendIcon } from '@/components/community/icons'

const refer = AREAS.refer

export type ReferTrip = {
  place: string
  when: string
  doctors: number
  href: string
}

export type ReferInvite = {
  id: string
  name: string
  meta: string
  status: string
}

export function ReferView({ trip, invites }: { trip: ReferTrip | null; invites: ReferInvite[] }) {
  return (
    <div>
      <AreaBand area="refer" title="Find & Refer" subtitle="Care for you on the road. Care for the people you love." />
      <Link prefetch href="/portal/passport" className="mt-4 flex min-h-[88px] items-center gap-3.5 rounded-[22px] border-2 bg-white px-4 py-[18px]" style={{ borderColor: refer.tint }}>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px]" style={{ background: refer.tint, color: refer.ink }}>
          <PlaneIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="nc-ui block text-[17px] font-extrabold tracking-[-0.02em] text-[#15202B]">I’m traveling</span>
          <span className="block text-[13.5px] leading-snug text-[#5b6773]">Find a NeuroChiro doctor in another state or country</span>
        </span>
        <ChevronIcon className="text-[#1F4F8C]" />
      </Link>
      <Link prefetch href="/portal/care/invite" className="mt-3 flex min-h-[88px] items-center gap-3.5 rounded-[22px] px-4 py-[18px] text-white" style={{ background: refer.color }}>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white/20 text-white">
          <SendIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="nc-ui block text-[17px] font-extrabold tracking-[-0.02em]">Send someone you love</span>
          <span className="block text-[13.5px] leading-snug text-white/90">Invite family or a friend to a doctor near them</span>
        </span>
        <ChevronIcon />
      </Link>

      {trip ? (
        <section className="mt-5">
          <SectionLabel>Your next trip</SectionLabel>
          <Link prefetch href={trip.href} className="mt-2.5 flex min-h-[72px] items-center justify-between gap-3 rounded-[18px] bg-white p-3.5">
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: refer.tint, color: refer.ink }}>
                <PinIcon />
              </span>
              <span>
                <span className="nc-ui block text-[15px] font-extrabold text-[#15202B]">{trip.place}</span>
                <span className="block text-[13px] text-[#5b6773]">{trip.when}</span>
              </span>
            </span>
            {trip.doctors > 0 ? (
              <span className="nc-ui shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-extrabold" style={{ background: refer.tint, color: refer.ink }}>
                {trip.doctors} {trip.doctors === 1 ? 'doctor' : 'doctors'} nearby
              </span>
            ) : null}
          </Link>
        </section>
      ) : null}

      {invites.length > 0 ? (
        <section className="mt-5">
          <SectionLabel>Sent invitations</SectionLabel>
          <ul className="mt-2.5 space-y-2">
            {invites.map((invite) => (
              <li key={invite.id} className="flex min-h-[68px] items-center gap-3 rounded-[18px] bg-white px-3.5 py-3">
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full nc-ui text-[14px] font-extrabold" style={{ background: refer.tint, color: refer.ink }}>
                  {invite.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="nc-ui block truncate text-[15px] font-extrabold text-[#15202B]">{invite.name}</span>
                  <span className="block truncate text-[13px] text-[#5b6773]">{invite.meta}</span>
                </span>
                <span className="nc-ui shrink-0 rounded-full bg-[#DCF1EE] px-2.5 py-1.5 text-[12px] font-extrabold text-[#0A6159]">{invite.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
