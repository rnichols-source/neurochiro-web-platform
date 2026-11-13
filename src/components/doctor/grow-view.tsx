import Link from 'next/link'

const CARDS = [
  { href: '/doctor/seminars', title: 'Seminars', detail: 'Host a seminar or find one near you.' },
  { href: '/doctor/chiromatch', title: 'ChiroMatch', detail: 'Match with an associate.' },
  { href: '/doctor/match', title: 'Match', detail: 'You and a student both say yes.' },
  { href: '/doctor/jobs', title: 'Jobs & hiring', detail: 'Post a role and read applications.' },
  { href: '/doctor/students', title: 'Browse students', detail: 'Search the full student list.' },
  { href: '/doctor/lives', title: 'The Weekly Adjustment', detail: 'Thursday at 8 PM ET.' },
  { href: '/doctor/marketplace', title: 'Synapse', detail: 'Member deals that are already open.' },
  { href: '/doctor/introductions', title: 'Introductions', detail: 'When a community member travels with their care.' },
  { href: '/doctor/referrals', title: 'Referral network', detail: 'Referrals you have sent and received.' },
  { href: '/doctor/community', title: 'Community', detail: 'Announcements that are already posted.' },
  { href: '/doctor/community-interest', title: 'Community interest', detail: 'People near your office raising a hand.' },
]

export function GrowView() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {CARDS.map((card) => (
        <Link key={card.href} href={card.href} className="rounded-[20px] border-2 border-[#EFE5F5] bg-white p-4">
          <span className="dp-ui block text-[16px] font-extrabold text-[#15202B]">{card.title}</span>
          <span className="mt-1 block text-[13px] leading-snug text-[#5b6773]">{card.detail}</span>
        </Link>
      ))}
    </div>
  )
}
