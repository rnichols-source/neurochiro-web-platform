import Link from 'next/link'
import { Card, GhostLink, Kicker, PrimaryLink } from '@/components/community/ui'
import { householdLine, type HomeDoctorCard } from '@/lib/community/logic'

export type HomeViewProps = {
  greeting: string
  initial: string
  doctor: HomeDoctorCard | null
  familyNames: string[]
  ready: boolean
}

export function HomeView({ greeting, initial, doctor, familyNames, ready }: HomeViewProps) {
  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <Link href="/portal" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          <span className="font-heading text-[13px] font-black tracking-[0.04em] text-neuro-navy">NEUROCHIRO</span>
        </Link>
        <Link href="/portal/you" aria-label="You" className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-neuro-navy font-heading text-[13px] font-bold text-white">
          {initial}
        </Link>
      </div>
      <h1 className="mb-2 font-heading text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-neuro-navy">{greeting}</h1>
      <p className="mb-4 inline-block rounded-full border border-[#d9dfe5] bg-white px-[9px] py-1 text-[11.5px] font-semibold text-neuro-navy">Community member</p>

      {!ready ? (
        <Card>
          <Kicker>Almost ready</Kicker>
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">Your home doctor, household, and privacy choices save with the latest database update. The screen is here. The save step is not on this environment yet.</p>
        </Card>
      ) : null}

      <Card>
        <Kicker>Your care</Kicker>
        {doctor ? (
          <>
            <div className="flex items-center gap-3">
              {doctor.photoUrl ? (
                <img src={doctor.photoUrl} alt="" className="h-[52px] w-[52px] shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#e8eef3] font-heading text-[16px] font-bold text-neuro-navy">{doctor.initials}</div>
              )}
              <div className="min-w-0">
                <h2 className="font-heading text-[16px] font-bold tracking-[-0.02em] text-neuro-navy">{doctor.title}</h2>
                <p className="mt-0.5 text-[12.5px] leading-snug text-[#3d4a57]">
                  {doctor.practice ? <>{doctor.practice}<br /></> : null}
                  {doctor.place}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {doctor.listed ? <PrimaryLink href={`/portal/visit?doctor=${doctor.id}`}>Request a visit</PrimaryLink> : <PrimaryLink href="/portal/find">Find a doctor</PrimaryLink>}
              <GhostLink href="/portal/care#message">Message</GhostLink>
            </div>
            {!doctor.listed ? <p className="mt-2 text-[12.5px] text-[#6b7785]">This office is not currently listed. You can choose another home doctor.</p> : null}
          </>
        ) : (
          <>
            <h2 className="font-heading text-[16px] font-bold tracking-[-0.02em] text-neuro-navy">Find your home doctor</h2>
            <p className="mt-1 text-[13.5px] leading-snug text-[#3d4a57]">Choose a listed nervous system chiropractor. They stay on this card, and you can ask them for a visit.</p>
            <div className="mt-3 flex gap-2">
              <PrimaryLink href="/portal/find">Find a doctor</PrimaryLink>
              <GhostLink href="/directory">Directory</GhostLink>
            </div>
          </>
        )}
      </Card>

      <Card>
        <Kicker>Your household</Kicker>
        <div className="flex items-center justify-between gap-2.5">
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">{householdLine(familyNames)}</p>
          <Link href="/portal/family" className="whitespace-nowrap text-[13px] font-semibold text-[#B4501A]">Open →</Link>
        </div>
      </Card>

      <Card>
        <Kicker>This week</Kicker>
        <div className="flex items-center justify-between gap-2.5">
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">A weekly check-in for your household is on the way. It is not a chart, and it is not here yet.</p>
          <Link href="/portal/week" className="whitespace-nowrap text-[13px] font-semibold text-[#B4501A]">See what’s coming →</Link>
        </div>
      </Card>

      <Card>
        <Kicker>Your passport</Kicker>
        <div className="flex items-center justify-between gap-2.5">
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">When you travel, your care can travel with you. A care passport is on the way.</p>
          <Link href="/portal/passport" className="whitespace-nowrap text-[13px] font-semibold text-[#B4501A]">Open →</Link>
        </div>
      </Card>

      <Card className="mb-0">
        <Kicker>Work in this field</Kicker>
        <div className="flex items-center justify-between gap-2.5">
          <p className="text-[13.5px] leading-snug text-[#3d4a57]">Openings in member offices will live here. Not yet.</p>
          <Link href="/portal/work" className="whitespace-nowrap text-[13px] font-semibold text-[#B4501A]">See openings →</Link>
        </div>
      </Card>

      <Link href="/portal/privacy" className="mt-3 block rounded-2xl bg-[#fdf1ea] px-3.5 py-3">
        <strong className="mb-1 block font-heading text-[13px] font-bold text-neuro-navy">You’re in control of what’s shared</strong>
        <p className="text-[12.5px] leading-snug text-[#3d4a57]">A doctor only sees what you choose. Nothing else goes over until you say so.</p>
      </Link>
    </div>
  )
}
