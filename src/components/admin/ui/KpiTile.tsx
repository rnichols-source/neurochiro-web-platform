import Link from 'next/link'

export function KpiTile({
  href,
  label,
  value,
  detail,
  caption,
}: {
  href: string
  label: string
  value: string
  detail?: string | null
  caption: string
}) {
  return (
    <Link
      href={href}
      className="block min-h-11 rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:border-neuro-orange"
    >
      <p className="text-sm text-neuro-gray">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-neuro-navy">{value}</p>
      {detail ? <p className="mt-1 text-sm tabular-nums text-neuro-navy">{detail}</p> : null}
      <p className="mt-2 text-xs leading-5 text-neuro-gray">{caption}</p>
    </Link>
  )
}
