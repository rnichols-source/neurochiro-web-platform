import Link from 'next/link'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange focus-visible:ring-offset-2 rounded-sm'

export function ConsentText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (!match) return <span key={index}>{part}</span>
        return (
          <Link key={index} href={match[2]} className={`text-neuro-orange-ink underline ${focusRing}`}>
            {match[1]}
          </Link>
        )
      })}
    </>
  )
}
