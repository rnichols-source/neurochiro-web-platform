import Link from 'next/link'
import { PlaceHeader } from '@/components/founder/header'
import { CONTENT_TOOLS } from '@/lib/founder/places'

export const dynamic = 'force-dynamic'

const LINKS = [
  { href: '/admin/seminars', title: 'Seminars', detail: 'Review and publish seminars' },
  { href: '/admin/approvals/seminars', title: 'Seminar approvals', detail: 'What is waiting on you' },
  { href: '/admin/jobs', title: 'Jobs', detail: 'The job board' },
  ...CONTENT_TOOLS.map((item) => ({ href: item.href, title: item.label, detail: 'Existing admin tool' })),
]

export default function WorkPage() {
  return (
    <div>
      <PlaceHeader place="people" title="Seminars, jobs, and the rest" subtitle="Every tool that used to sit in the old More menu." />
      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 lg:px-8">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-[22px] bg-white p-4">
            <h2 className="fd-ui text-[16px] font-extrabold">{link.title}</h2>
            <p className="text-[13px] text-[#5b6773]">{link.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
