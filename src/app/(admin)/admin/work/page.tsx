import Link from 'next/link'
import { PlaceHeader } from '@/components/founder/header'
import { requireAdminPage } from '@/lib/founder/guard'

export const dynamic = 'force-dynamic'

const LINKS = [
  { href: '/admin/seminars', title: 'Seminars', detail: 'Review and publish seminars' },
  { href: '/admin/jobs', title: 'Jobs', detail: 'The job board' },
]

export default async function WorkPage() {
  await requireAdminPage()
  return (
    <div>
      <PlaceHeader place="people" title="Seminars and jobs" subtitle="Seminars to review, and the job board." />
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
