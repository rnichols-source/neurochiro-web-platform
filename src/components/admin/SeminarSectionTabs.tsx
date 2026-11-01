import Link from 'next/link'

export function SeminarSectionTabs({ active }: { active: 'listings' | 'approvals' }) {
  const items = [
    { id: 'listings' as const, href: '/admin/seminars', label: 'Listings' },
    { id: 'approvals' as const, href: '/admin/approvals/seminars', label: 'Approvals' },
  ]
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${item.id === active ? 'bg-neuro-orange text-white' : 'border border-black/10 bg-white text-neuro-navy'}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
