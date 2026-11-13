'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AREAS } from '@/components/community/areas'
import { bleed } from '@/components/community/chrome'
import { FavoriteButton } from '@/components/community/favorite-button'
import { BackIcon, ClockIcon } from '@/components/community/icons'
import type { RemedyBlock, RemedyCard } from '@/lib/community/library-model'

export function RemedyFocus({
  title,
  crumb,
  cards,
  savedKeys,
  children,
}: {
  title: string
  crumb: string
  cards: RemedyCard[]
  savedKeys: string[]
  children?: React.ReactNode
}) {
  const [key, setKey] = useState(cards[0]?.key || '')
  const card = cards.find((item) => item.key === key) || cards[0]
  if (!card) return null
  const saved = new Set(savedKeys)
  const care = AREAS.care

  return (
    <div>
      <header
        className={`nc-band ${bleed} rounded-b-[26px] px-5 pb-[18px] pt-3 text-white lg:rounded-none lg:px-10 lg:pb-7 lg:pt-6`}
        style={{ ['--c' as string]: care.color, ['--d' as string]: care.dark }}
      >
        <Link prefetch href="/portal/care#remedies" className="nc-ui inline-flex min-h-11 items-center gap-0.5 rounded-full bg-white/20 py-1.5 pl-2 pr-3.5 text-[15px] font-extrabold text-white">
          <BackIcon />
          Care
        </Link>
        <p className="mt-3 text-[12px] font-bold text-white/90">{crumb}</p>
        <h1 className="nc-ui mt-1 text-[23px] font-extrabold leading-[1.15] tracking-[-0.025em] text-white">{title}</h1>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Remedies">
        {cards.map((item) => {
          const on = item.key === card.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setKey(item.key)}
              className={`nc-ui min-h-11 shrink-0 rounded-full px-3 text-[12.5px] font-bold ${on ? 'bg-white text-[#0A6159]' : 'bg-white/20 text-white'}`}
            >
              {shortName(item.name)}
            </button>
          )
        })}
        </div>
      </header>
      {children}
      <article className="mt-4 rounded-[22px] bg-white p-[18px]">
        {card.badges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {card.badges.map((badge) => (
              <span key={badge} className="nc-ui rounded-full bg-[#DCF1EE] px-2 py-1 text-[11px] font-extrabold text-[#0A6159]">{badge}</span>
            ))}
          </div>
        ) : null}
        <h2 className="nc-ui mb-3 mt-2.5 text-[22px] font-extrabold tracking-[-0.02em] text-[#15202B]">{card.name}</h2>
        {card.tagline ? <p className="mb-3 text-[14px] leading-snug text-[#3d4a57]">{card.tagline}</p> : null}
        {card.blocks.map((block, index) => (
          <Block key={`${card.key}-${index}`} block={block} />
        ))}
        <FavoriteButton remedyKey={card.key} name={card.name} saved={saved.has(card.key)} />
      </article>
    </div>
  )
}

function Block({ block }: { block: RemedyBlock }) {
  if (block.type === 'label') {
    return <h3 className="nc-ui mb-2 mt-4 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#0A6159]">{block.text}</h3>
  }
  if (block.type === 'list') {
    return (
      <div className="rounded-[14px] bg-[#F5F3EF] p-3">
        {block.items.map((item) => {
          const parts = splitNeed(item)
          return (
            <p key={item} className="mt-1.5 flex items-start gap-2.5 text-[15px] first:mt-0">
              {parts.amount ? <span className="nc-ui mt-0.5 shrink-0 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-center text-[13px] font-extrabold">{parts.amount}</span> : null}
              <span>{parts.rest}</span>
            </p>
          )
        })}
      </div>
    )
  }
  if (block.type === 'steps') {
    return (
      <ol className="list-none">
        {block.items.map((item, index) => (
          <li key={item} className="flex items-center gap-2.5 py-1.5 text-[15px]">
            <span className="nc-ui grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#0E857A] text-[13px] font-extrabold text-white">{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    )
  }
  if (block.tone === 'timing') {
    return (
      <p className="mt-3 flex gap-2 rounded-xl bg-[#FFF5E9] p-3 text-[13.5px] leading-snug text-[#8a4a12]">
        <ClockIcon />
        <span>{block.text}</span>
      </p>
    )
  }
  if (block.tone === 'warning') {
    return <p className="mt-3 rounded-xl bg-[#FDECEA] px-3 py-2 text-[13.5px] leading-snug text-[#7a1d17]">{block.text}</p>
  }
  return <p className="mt-3 text-[14px] leading-snug text-[#3d4a57]">{block.text}</p>
}

function shortName(name: string): string {
  return name.length > 28 ? `${name.slice(0, 26)}…` : name
}

function splitNeed(item: string): { amount: string; rest: string } {
  const match = item.match(/^(\d+(?:[./]\d+)?(?:\s*-\s*\d+(?:[./]\d+)?)?\s*(?:oz|tsp|tbsp|cups?|drops?|ml)?)\s+(.+)$/i)
  if (!match) return { amount: '', rest: item }
  return { amount: match[1].trim(), rest: match[2] }
}
