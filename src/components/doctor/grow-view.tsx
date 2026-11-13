import Link from 'next/link'

const CARDS = [
  { href: '/doctor/students', title: 'Students', detail: 'Browse students looking for a practice.' },
  { href: '/doctor/referrals', title: 'Referral network', detail: 'Referrals you have sent and received.' },
  { href: '/doctor/introductions', title: 'Introductions', detail: 'When a community member travels with their care.' },
  { href: '/doctor/community', title: 'Community', detail: 'Announcements that are already posted.' },
  { href: '/doctor/community-interest', title: 'Community interest', detail: 'People near your office raising a hand.' },
  { href: '/doctor/coming-soon', title: 'Coming soon', detail: 'ChiroMatch, hiring, seminars, CE, and screening kits.' },
]

export function GrowView() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {CARDS.map((card) => (
        <Link prefetch key={card.href} href={card.href} className="rounded-[20px] border-2 border-[#EFE5F5] bg-white p-4">
          <span className="dp-ui block text-[16px] font-extrabold text-[#15202B]">{card.title}</span>
          <span className="mt-1 block text-[13px] leading-snug text-[#5b6773]">{card.detail}</span>
        </Link>
      ))}
    </div>
  )
}
