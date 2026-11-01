import Link from 'next/link'

export function Tabs({
  items,
  active,
}: {
  items: { id: string; href: string; label: string }[]
  active: string
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const on = item.id === active
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium ${on ? 'bg-neuro-orange text-white' : 'border border-black/10 bg-white text-neuro-navy'}`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
